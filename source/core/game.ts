import EventEmitter, { EventMap } from "./event-emitter";
import { RefreshTime } from "./types";
import GameObject from "./game-object";
import InputController from "./input-controller";
import Camera from "./camera";

class GameRoot extends GameObject {
    constructor(game: Game) {
        super();
        this._game = game;
        this._id = 0;
        this._children = [];
    }
}

export interface GameEventTypes extends EventMap {
    gameObjectAdded: [obj: GameObject, oldParent?: GameObject, newParent?: GameObject];
    gameObjectRemoved: [obj: GameObject, oldParent?: GameObject];
}

export interface GameProperties {
    paused?: boolean;
    timeScale?: number;
    minUpdateTime?: number;
    onGameObjectAdded?: (obj: GameObject) => void;
    onGameObjectRemoved?: (obj: GameObject) => void;
    onGameObjectMoved?: (obj: GameObject, oldParent: GameObject, newParent: GameObject) => void;
    gameLoopStep?: {
        request: (callback: () => void) => number;
        cancel: (loopId: number) => void;
    };
    idRange?: {
        min: number;
        max: number;
    };
}

export default class Game<
    T_EventMap extends GameEventTypes = GameEventTypes
> extends EventEmitter<T_EventMap> {
    debug: boolean;
    _idRange: {
        min: number;
        max: number;
    };
    _curId: number;
    _running: boolean;
    _paused: boolean;
    _curFrame: number;
    _lastUpdateTime: number;
    _timeScale: number;
    _minUpdateTime: number;
    _inputControllers: Array<InputController>;
    // We should consider changing gameTree to be a tree of nodes, where
    // one of the node's properties is the game object. This way we can
    // allow game objects to define their own `parent` and `children` properties
    _gameTree: GameObject;
    _gameObjects: Record<number, GameObject>;
    _tagMap: Record<string, Array<number>>;
    _addingList: Array<{
        obj: GameObject;
        parent: number | GameObject;
        resolve: (value: unknown) => void;
        reject: (reason?: any) => void;
    }>;
    _removingList: Map<
        number,
        { obj: GameObject; resolve: (value: unknown) => void; reject: (reason?: any) => void }
    >;
    _moveList: Map<
        number,
        {
            obj: GameObject;
            parent: GameObject;
            resolve: (value: unknown) => void;
            reject: (reason?: any) => void;
        }
    >;

    _requestGameLoopStep: (callback: () => void) => number;
    _cancelGameLoopStep: (loopId: number) => void;

    constructor(properties: GameProperties = {}) {
        super();
        this.debug = false;

        /* Set up some 'private' variables. */
        this._idRange = {
            min: 0,
            max: Number.MAX_SAFE_INTEGER
        };
        this._curId = 0;
        this._running = false;
        this._paused = false;
        this._curFrame = null;
        this._timeScale = 1;
        this._minUpdateTime = 10;

        // All input controllers. Stored separately from game objects because reasons.
        this._inputControllers = [];

        // The tree of all objects in the game for traversal when updating/drawing, and available for other processing.
        this._gameTree = new GameRoot(this);
        // Map of all object Ids to the objects, prepopulated with the root.
        this._gameObjects = { 0: this._gameTree };
        // A map of tags to object Id lists for quick access/categorization outside of the tree.
        this._tagMap = {};

        this._addingList = []; // No IDs to map yet, so just use an array.
        this._removingList = new Map(); // Only allow an object to be removed once, so a map.
        this._moveList = new Map(); // Only allow an object to be moved once, so a map.

        if (properties.idRange) {
            this._idRange = { min: properties.idRange.min, max: properties.idRange.max };
            // and update our initial id
            this._curId = this._idRange.min;
        }

        if (typeof properties.paused === "boolean") this._paused = properties.paused;

        if (typeof properties.timeScale === "number") this._timeScale = properties.timeScale;

        if (typeof properties.minUpdateTime === "number")
            this._minUpdateTime = properties.minUpdateTime;

        if (properties.gameLoopStep) {
            this._requestGameLoopStep = properties.gameLoopStep.request;
            this._cancelGameLoopStep = properties.gameLoopStep.cancel;
        } else {
            let requestStep = globalThis.requestAnimationFrame;
            let cancelStep = globalThis.cancelAnimationFrame;

            // Ensure requestAnationFrame and cancelAnimationFrame exists properly.
            let lastTime = 0;
            const vendors = ["webkit", "moz"];
            for (let x = 0; x < vendors.length && !this._requestGameLoopStep; ++x) {
                const gt = globalThis as Record<string, any>;
                requestStep = gt[`${vendors[x]}RequestAnimationFrame`];
                cancelStep =
                    gt[`${vendors[x]}CancelAnimationFrame`] ||
                    gt[`${vendors[x]}CancelRequestAnimationFrame`];
            }

            if (!requestStep) {
                requestStep = (callback: FrameRequestCallback) => {
                    const curTime = new Date().getTime();
                    const timeToCall = Math.max(0, this._minUpdateTime - (curTime - lastTime));
                    const id = +setTimeout(function () {
                        callback(curTime + timeToCall);
                    }, timeToCall); // +setTimeout forces it to a number.
                    lastTime = curTime + timeToCall;
                    return id;
                };

                cancelStep = (id) => clearTimeout(id);
            }
            this._requestGameLoopStep = (callback) => requestStep(callback);
            this._cancelGameLoopStep = (id) => cancelStep(id);
        }
    }

    /* Public Functions */

    start() {
        this._start();
    }

    stop() {
        this._stop();
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;
    }

    isPaused() {
        return this._paused;
    }

    // Invokes callback on the rootObj and every child object recursively,
    // in a depth first traversal.
    traverse(rootObj: GameObject, callback: (obj: GameObject) => boolean): void;
    traverse(rootObjId: number | GameObject, callback: (obj: GameObject) => boolean): void {
        if (typeof rootObjId === "object") rootObjId = rootObjId.id;

        // Updates will be a depth first traversal of the _gameTree.
        const updateGroup = [rootObjId as number];

        // Begin traversal.
        while (updateGroup.length > 0) {
            // Grab the next Id.
            const objId = updateGroup.pop();

            // Evaluate to the object
            const obj = this._gameObjects[objId];

            // Now execute the callback the object.
            const visitChildren = callback(obj);

            // If the callback returned false, then we don't want
            // to process any of its children.
            if (visitChildren && obj._children) {
                // Otherwise, add its children in.
                // Push children into the front so we can continue depth first
                // (in reverse so their popped in the correct order)
                for (let i = obj._children.length - 1; i >= 0; i--)
                    updateGroup.push(obj._children[i]);
            }
        }
    }

    // Accepts one or more strings as tag names to search for. Results of each
    // tag are unioned and returned.
    // Alternatively, accepts one object in the following format:
    // {
    //   op: 'inclusive', // or 'exclusive'
    //   tags: ["a","b","c"]
    // }
    // Where 'inclusive' unions the results, and 'exclusive' filters the results in
    // order of the tags. For example, if the tags were "a" and "b", first all objects
    // with the tag "a" would be obtained, and then any of those with the tag "b" would
    // be obtained, but not any with "b" and not "a".
    // Returns a list of objects that meet the filter requirements.
    filter(...tags: Array<string>): Array<GameObject>;
    filter(tag: { op: "inclusive" | "exclusive"; tags: Array<string> }): Array<GameObject>;
    filter(...tags: Array<unknown>): Array<GameObject> {
        if (typeof tags === "undefined" || tags == null || tags.length == 0) {
            // Return everything
            tags = [""];
        }

        let sTags = tags as Array<string>;

        let first = tags[0];
        let op = "inclusive";
        if (typeof first == "object") {
            const oTag = first as { op: "inclusive" | "exclusive"; tags: Array<string> };
            sTags = oTag.tags;
            op = oTag.op;
        }

        let results: null | Record<number, number> = null;
        for (let i = 0; i < sTags.length; i++) {
            const tag = sTags[i];
            const curResults = this._tagMap[tag];

            if (curResults) {
                let oldResults: null | Record<number, number> = null;

                // If we already have some results, allow us to process exclusively.
                if (results != null && op == "exclusive") {
                    oldResults = results;
                    results = {};
                } else {
                    // Everything else is considered inclusive.
                    if (results == null) results = {};
                }

                // Add each in.
                for (let j = 0; j < curResults.length; j++) {
                    const objId = curResults[j];

                    // If we have no old results to compare against, or if we exist in old results,
                    // we can be added.
                    if (oldResults == null || typeof oldResults[objId] !== "undefined") {
                        results[objId] = objId;
                    }
                }
            }
        }

        const ret = [];
        if (results) {
            for (let id in results) ret.push(this._gameObjects[id]);
        }
        return ret;
    }

    addTag(objId: number, tag: string) {
        this.addTags(objId, tag);
    }

    addTags(objId: number, ...tags: Array<string>): void {
        // First translate to the actual object.
        let obj: GameObject;
        if (typeof objId === "number") obj = this._gameObjects[objId];

        if (!obj) throw "The specified object has not yet been added into the game.";

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            // Add the tag onto the object's tags.
            if (obj._tags) {
                // Only allow the tag once in our list.
                if (obj._tags.indexOf(tag) == -1) obj._tags.push(tag);
            } else {
                obj._tags = [tag];
            }
            // Then add into the tag map.
            if (!this._tagMap[tag]) this._tagMap[tag] = [];

            // Only allow the objId once in a list for any one tag.
            if (this._tagMap[tag].indexOf(obj.id) == -1) this._tagMap[tag].push(obj.id);
        }
    }

    removeTag(objId: number, tag: string) {
        this.removeTags(objId, tag);
    }

    removeTags(objId: number, ...tags: Array<string>): void {
        // First translate to the actual object.
        let obj: GameObject;
        if (typeof objId === "number") obj = this._gameObjects[objId];

        if (!obj) throw "The specified object has not yet been added into the game.";

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            // Remove the tag from the object's tags.
            if (obj._tags) {
                let index = obj._tags.indexOf(tag);
                if (index >= 0) {
                    obj._tags.splice(index, 1);
                }
            }

            // Then remove from the tag map.
            if (this._tagMap[tag]) {
                let index = this._tagMap[tag].indexOf(obj.id);
                if (index >= 0) {
                    this._tagMap[tag].splice(index, 1);
                }

                // Remove this tag completely if no one has it.
                if (this._tagMap[tag].length == 0) delete this._tagMap[tag];
            }
        }
    }

    getGameObject(objId: number): GameObject {
        return this._gameObjects[objId];
    }

    async moveGameObject(obj: GameObject, newParent?: number | GameObject): Promise<GameObject>;
    async moveGameObject(objId: number, newParent?: number | GameObject): Promise<GameObject>;
    async moveGameObject(
        objOrId: number | GameObject,
        newParent?: number | GameObject
    ): Promise<GameObject> {
        if (objOrId == 0 || (objOrId as GameObject).id == 0) throw "Cannot move the root object.";

        let id = objOrId as number;
        // We want to be dealing with the ID.
        if (typeof objOrId === "object") {
            id = objOrId.id;
        }

        // Make sure obj is part of the game, and that parent is.
        const obj = this._gameObjects[id];
        if (!obj) throw "The specified object has not yet been added into the game.";

        let parentId = newParent as number;
        // We want to be dealing with the ID.
        if (typeof newParent === "object") {
            parentId = newParent.id;
        }

        const parentObj = this._gameObjects[parentId];
        if (!parentObj) throw "The specified parent has not yet been added into the game.";

        if (!this._removingList.has(id))
            throw "The specified object is scheduled for removal and cannot be moved.";

        return await new Promise((resolve, reject) => {
            this._moveList.set(id, {
                obj: obj,
                parent: parentObj,
                resolve: resolve,
                reject: reject
            });
        });
    }

    // Adds the specified object into the game, including any tags. If a parent is specified, the object
    // is added to the parent in the object hierarchy. If the object contains children, those children are
    // also properly added.
    async addGameObject(obj: GameObject, parent?: number | GameObject): Promise<GameObject> {
        return (await this.addGameObjects([obj], parent))[0];
    }

    async addGameObjects(objs: GameObject[], parent?: number | GameObject): Promise<GameObject[]> {
        // Parent is allowed to not be part of the game yet.
        // (For instance adding a parent, and then a child in the same frame)
        if (typeof parent === "number") {
            if (!this._gameObjects[parent])
                throw "The specified parent has not yet been added into the game.";
            parent = parent as number;
        } else if (typeof parent === "undefined" || parent == null) {
            parent = 0;
        } else if (typeof parent === "object") {
            const gParent = parent as GameObject;
            if (gParent.id) {
                // If the ID is valid, just use that.
                if (this._gameObjects[gParent.id]) parent = gParent.id;
                // Otherwise, we'll assume the parent is waiting to be added.
            }
        } else {
            throw "The specified parent is not a valid parent object.";
        }

        return await Promise.all(
            objs.map((obj) => {
                const gObj = obj as GameObject;
                // Make sure obj is not part of the game.
                if (gObj.id && this._gameObjects[gObj.id])
                    throw (
                        "The specified object to add has an id of '" +
                        gObj.id +
                        "' and is already part of the game."
                    );

                // At this point parent is either an ID that exists in the tree,
                // or an object that doesn't yet.
                return new Promise<GameObject>((resolve, reject) => {
                    this._addingList.push({
                        obj: obj,
                        parent: parent,
                        resolve: resolve,
                        reject: reject
                    });
                });
            })
        );
    }

    async removeGameObject(objId: number): Promise<GameObject>;
    async removeGameObject(obj: GameObject): Promise<GameObject>;
    async removeGameObject(objOrId: number | GameObject): Promise<GameObject> {
        if (objOrId == 0 || (objOrId as GameObject).id == 0)
            throw "Cannot remove the root object from game.";

        let id = objOrId as number;
        if (typeof objOrId === "object") id = objOrId.id;

        const obj = this._gameObjects[id];
        // Cannot remove an object that isn't already in the game.
        if (!obj) throw "The specified object has not yet been added into the game.";

        // Cannot remove an object that is being moved.
        if (this._moveList.has(id))
            throw "The specified object is scheduled for being moved and cannot be removed.";

        // Children first.
        (obj._children || []).forEach((child) => {
            if (this.getGameObject(child)?.active) this.removeGameObject(child);
        });

        return await new Promise((resolve, reject) => {
            this._removingList.set(id, { obj: obj, resolve: resolve, reject: reject });
        });
    }

    setTimeScale(tScale: number) {
        this._timeScale = tScale;
    }

    getTimeScale() {
        return this._timeScale;
    }

    addInputController(controller: InputController) {
        this._inputControllers.push(controller);
    }

    // eslint-disable-next-line no-unused-vars
    removeInputController(controller: InputController) {
        // Can't do it for now
    }

    /* Private Functions */

    _addGameObject(
        obj: GameObject,
        parent: number | GameObject,
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void
    ) {
        // At this point, our parent must have an id, and exist in the tree.
        let oParent: GameObject;
        if (typeof parent === "number") oParent = this._gameObjects[parent];
        else if (typeof parent === "object") oParent = this._gameObjects[parent.id];

        if (!oParent) {
            // The parent may have been removed before we could be added.
            // Or the caller added the parent and child in the wrong order.
            // In this case just return.
            reject("Parent does not exist. Ensure the parent was added before the child.");
            return;
        }

        const toAdd = [{ obj: obj, parent: oParent }];

        const added: Array<GameObject> = [];
        while (toAdd.length > 0) {
            const cur = toAdd.pop();
            const newObj = cur.obj;
            const newParent = cur.parent;

            // if we don't have an id, generate one for us.
            if (!newObj.id) {
                let id = null;
                let startId = null;
                // Generate the next available Id.
                // Verify it is available
                while (id == null || typeof this._gameObjects[id] !== "undefined") {
                    // Increment (with overflow looping)
                    if (this._curId == this._idRange.max) this._curId == this._idRange.min;
                    else this._curId = this._curId + 1;
                    id = this._curId;
                    if (startId == null) startId = id;
                    else if (startId == id) {
                        // We've exhausted all ids.
                        reject("No unused ids left to assign.");
                    }
                }
                newObj.id = id;
            }
            newObj._game = this;

            // Add to the _gameObjects.
            this._gameObjects[newObj.id] = newObj;
            added.push(newObj);

            // Add to the _gameTree.
            if (!newParent._children) newParent._children = [];
            newParent._children.push(newObj.id);
            newObj._parent = newParent.id;
            delete newObj._initialParent;

            // Add in any tags.
            if (newObj._tags) {
                const tags = newObj._tags;
                delete newObj._tags; // Delete initial tag list. They will be readded in 'addTags'
                this.addTags(newParent.id, ...tags);
            }
            if (newObj.classTags) {
                // Check their 'object level tags' too, but don't delete them.
                this.addTags(newObj.id, ...newObj.classTags);
            }

            // Then process any children specified.
            if (newObj._initialChildren != null) {
                for (let c = 0; c < newObj._initialChildren.length; c++) {
                    const child = newObj._initialChildren[c];
                    toAdd.push({ obj: child, parent: newObj });
                }
                // Clear out children now that we're part of the tree.
                delete newObj._initialChildren;
            }
        }

        added.forEach((added) => {
            if (added.gameObjectAdded) added.gameObjectAdded();
        });

        added.forEach((added) => this.emit("gameObjectAdded", added));

        resolve(obj);
    }

    // eslint-disable-next-line no-unused-vars
    _removeGameObject(
        obj: GameObject,
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void
    ) {
        // If it doesn't exist, it may have already been removed (directly or
        // implicitly by having its parent removed),
        // or it may have never been added.
        if (!this._gameObjects[obj.id]) {
            reject("The specified object does not exist in the game. Was it already removed?");
            return;
        }

        const toRemove = [obj];
        let head = obj;
        const removed = [];

        // Process post-order, removing children before parents.
        while (toRemove.length > 0) {
            let obj = toRemove[toRemove.length - 1];

            const isLeaf = !obj._children || !obj._children.length;
            const headWasChild = !isLeaf && obj._children.indexOf(head.id) != -1;

            if (isLeaf || headWasChild) {
                // Remove this one.
                toRemove.pop();
                head = obj;

                // Remove tags.
                if (obj.tags && obj.tags.length > 0) {
                    obj.tags.forEach((tag) => {
                        // Remove from the tag map.
                        if (this._tagMap[tag]) {
                            let index = this._tagMap[tag].indexOf(obj.id);
                            if (index >= 0) {
                                this._tagMap[tag].splice(index, 1);
                            }

                            // Remove this tag completely if no one has it.
                            if (this._tagMap[tag].length == 0) delete this._tagMap[tag];
                        }
                    });
                }

                // Remove from parent's children collection
                const parent = this._gameObjects[obj._parent];
                if (parent != null) {
                    const index = parent._children.indexOf(obj.id);
                    if (index > -1) parent._children.splice(index, 1);
                    // Then remove parent reference.
                    delete obj._parent;
                }

                // Remove from game objects
                delete this._gameObjects[obj.id];

                delete obj._game;
                obj._removed = true;

                removed.push(obj);
            } else {
                // Add children for removal first.
                for (let c = 0; c < obj._children.length; c++) {
                    toRemove.push(this._gameObjects[obj._children[c]]);
                }
            }
        }

        removed.forEach((removed) => this.emit("gameObjectRemoved", removed));

        removed.forEach((removed) => {
            if (removed.gameObjectRemoved) removed.gameObjectRemoved();
        });
        resolve(obj);
    }

    _moveGameObject(
        obj: GameObject,
        parentId: number,
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void
    ) {
        const id = obj.id;
        // If it doesn't exist, it has already been removed.
        if (!this._gameObjects[id]) {
            reject("The specified object does not exist in the game. Was it already removed?");
            return;
        }

        const newParent = this._gameObjects[parentId];

        let oldParent = null;

        let p = null;
        // If it doesn't exist, it has already been removed.
        if (!newParent) {
            reject(
                "The specified parent object does not exist in the game. Was it already removed?"
            );
            return;
        }

        // Should be as easy as taking the object, and changing it's parents.
        // The children should all stay the same.
        oldParent = this._gameObjects[obj._parent];
        if (oldParent != null) {
            const index = oldParent._children.indexOf(id);
            if (index > -1) oldParent._children.splice(index, 1);
        }

        // Add to new parent.
        newParent._children.push(id);

        // Update parent reference.
        obj._parent = parentId;

        if (obj.gameObjectMoved) obj.gameObjectMoved(oldParent, newParent);

        this.emit("gameObjectAdded", obj, oldParent, newParent);

        resolve(obj);
    }

    _start() {
        if (this._running) return;

        // Begin our loop.
        let gameLoop: () => void;
        let updateTime = 0;
        let animationTime = 0;
        gameLoop = () => {
            if (!this._running) return;

            if (this._lastUpdateTime == null) this._lastUpdateTime = Date.now();

            const curTime = Date.now();

            const lastUpdateTime = this._lastUpdateTime;
            const elapsed = curTime - this._lastUpdateTime;
            this._lastUpdateTime = curTime;

            // Process user input.
            this._processInput();

            if (!this._paused) {
                // tDelta should be in terms of seconds, so convert from ms.
                let tDelta = (this._minUpdateTime / 1000) * this._timeScale;

                // Only count in updateTime if we aren't paused.
                updateTime += elapsed;
                animationTime += elapsed;

                // If it is taking us too long, just skip some updates.
                // :(
                if (updateTime > this._minUpdateTime * 100) updateTime = 0;

                while (updateTime >= this._minUpdateTime) {
                    // Update the world
                    this._update({
                        timeAdvance: tDelta,
                        timeScale: this._timeScale,
                        animationTime: animationTime,
                        curTime: curTime,
                        lastTime: lastUpdateTime
                    });
                    updateTime -= this._minUpdateTime;
                }
            }

            // Repaint the world.
            this._refresh({
                timeAdvance: (updateTime / 1000) * this._timeScale,
                timeScale: this._timeScale,
                animationTime: animationTime,
                curTime: curTime,
                lastTime: lastUpdateTime
            });

            // Loop again.
            this._curFrame = this._requestGameLoopStep(gameLoop);
        };

        this._running = true;
        this._curFrame = this._requestGameLoopStep(gameLoop);
    }

    _stop() {
        if (!this._running) return;

        this._running = false;
        if (this._curFrame != null) this._cancelGameLoopStep(this._curFrame);
    }

    _processInput() {
        // update all controllers, which will trigger any necessary binds.
        for (let i = 0; i < this._inputControllers.length; i++) {
            this._inputControllers[i].update();
        }
    }

    _update(time: RefreshTime) {
        this.traverse(this._gameTree, (obj) => {
            if (!obj) console.log(this._gameTree);

            // Now execute the update of the object (if it wants to be).
            if (obj.update) {
                obj.update(time);
            }

            // If the object has the 'avoidChildrenUpdate' flag, then we
            // should not add the children
            return !obj.avoidChildrenUpdate;
        });

        // Once we're done updating, go ahead and add or remove objects.
        // Order shouldn't matter here, but we'll remove, move, then add.
        for (let [, value] of this._removingList) {
            this._removeGameObject(value.obj, value.resolve, value.reject);
        }
        for (let [, value] of this._moveList) {
            this._moveGameObject(value.obj, value.parent.id, value.resolve, value.reject);
        }
        for (let a = 0; a < this._addingList.length; a++) {
            const obj = this._addingList[a];
            this._addGameObject(obj.obj, obj.parent, obj.resolve, obj.reject);
        }
        this._removingList.clear();
        this._moveList.clear();
        this._addingList = [];
    }

    _refresh(time: RefreshTime) {
        // Find all (enabled) cameras.
        const cameraObjects = (this.filter("camera") as Array<Camera>).filter((c) => !c.isDisabled);
        // Render everything for each camera.
        for (let index in cameraObjects) {
            const camera = cameraObjects[index];

            this._refreshCamera(time, camera);
        }

        for (let index in cameraObjects) {
            const camera = cameraObjects[index];
            if (camera.drawDoubleBuffer) {
                // Once we're done drawing, draw us to the swap buffer, if we're doing that.
                camera.drawDoubleBuffer();
            }
        }
    }

    _refreshCamera(time: RefreshTime, camera: Camera) {
        // Clear the camera.
        camera.clear();

        // calc the camera's view
        camera.calculateView(time);

        // Now traverse our tree in order to draw each object.
        // We won't use the Traverse call for this one, as we need more control over pushes an pops
        // by adding context restores.

        // Updates will be a depth first traversal of the _gameTree.
        const drawGroup: Array<{ id?: number; isRestore?: boolean }> = [{ id: this._gameTree.id }];

        // Begin traversal.
        while (drawGroup.length > 0) {
            // Grab the next draw request.
            const drawReq = drawGroup.pop();
            // Is this an object?
            if (typeof drawReq.id === "number") {
                // Evaluate to the object
                const obj = this._gameObjects[drawReq.id];
                if (!obj) console.log(this._gameTree);

                const doDraw = (obj.draw || (this.debug && obj.debugDraw)) && camera.allowDraw(obj);

                // First push a restore, if we will be updating.
                if (doDraw) drawGroup.push({ isRestore: true });

                // If the object has the 'avoidChildrenDrawing' flag, then we
                // should not add the children
                if (!obj.avoidChildrenDrawing && obj._children) {
                    // Check if children should be sorted first.
                    let children = obj._children;
                    if (obj.childrenSort) {
                        // children is a list of object ids. we need these
                        // to be the actual objects instead.
                        let cObjs = obj._children.map((id) => {
                            return this._gameObjects[id];
                        });
                        // Sort them
                        cObjs = obj.childrenSort(camera, cObjs);
                        // And back to their Ids.
                        children = cObjs.map((cObj) => {
                            return cObj.id;
                        });
                    }

                    // Otherwise, add it's children in.
                    // Push children into the front so we can continue depth first
                    for (let i = children.length - 1; i >= 0; i--) {
                        // Push the child.
                        drawGroup.push({ id: children[i] });
                    }
                }

                // Now execute the draw of the object (if it wants to be).
                if (doDraw) {
                    camera.saveState(); // Always save if we're drawing.

                    // Do the drawing.
                    if (obj.draw) camera.drawObject(obj, time);

                    // Do any debug drawing.
                    if (this.debug && obj.debugDraw) camera.debugDrawObject(obj, time);
                }
            }
            // Otherwise, it's a restore.
            else if (drawReq.isRestore) {
                camera.restoreState();
            }
        }
    }
}
