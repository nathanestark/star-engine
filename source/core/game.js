export default class Game {
    constructor(properties = {}) {
        this.debug = false;

        /* Set up some 'private' variables. */
        this._curId = 0;
        this._running = false;
        this._paused = false;
        this._curFrame = null;
		this._timeScale = 1;
		this._minUpdateTime = 10;

        // All input controllers. Stored separately from game objects because reasons.
        this._inputControllers = [];

        // The tree of all objects in the game for traversal when updating/drawing, and available for other processing.
        this._gameTree = { id:0, children: [] };
        // Map of all object Ids to the objects, prepopulated with the root.
        this._gameObjects = { 0: this._gameTree };
        // A map of tags to object Id lists for quick access/categorization outside of the tree.
        this._tagMap = {};

        this._addingList = []; // No IDs to map yet, so just use an array.
        this._removingList = new Map(); // Only allow an object to be removed once, so a map.
        this._moveList = new Map(); // Only allow an object to be moved once, so a map.

		if(properties.paused)
			this._paused = properties.paused;

		if(properties.timeScale)
			this._timeScale = properties.timeScale;

		if(properties.minUpdateTime)
			this._minUpdateTime = properties.minUpdateTime;

		if(properties.onGameObjectAdded)
			this._onGameObjectAdded = properties.onGameObjectAdded;

		if(properties.onGameObjectRemoved)
			this._onGameObjectRemoved = properties.onGameObjectRemoved;

        // Ensure requestAnationFrame and cancelAnimationFrame exists properly.
        let lastTime = 0;
        const vendors = ['webkit', 'moz'];
        for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
                window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback, element) {
                const curTime = new Date().getTime();
                const timeToCall = Math.max(0, this._minUpdateTime - (curTime - lastTime));
                const id = window.setTimeout(function () { callback(curTime + timeToCall); }, timeToCall);
                lastTime = curTime + timeToCall;
                return id;
            }.bind(this);

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };

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
    traverse(rootObjId, callback) {

        if (typeof (rootObjId) === "object")
            rootObjId = rootObjId.id;

        // Updates will be a depth first traversal of the _gameTree.
        const updateGroup = [rootObjId];

        // Begin traversal.
        while (updateGroup.length > 0) {
            // Grab the next Id.
            const objId = updateGroup.pop();

            // Evaluate to the object
            const obj = this._gameObjects[objId];

            // Now execute the callback the object.
            const visitChildren = callback(obj);

            // If the callback returned false, then we don't want
            // to process any of it's children.
            if (visitChildren && obj.children) {
                // Otherwise, add it's children in.
                // Push children into the front so we can continue depth first
                // (in reverse so their popped in the correct order)
                for (let i = obj.children.length - 1; i >= 0; i--)
                    updateGroup.push(obj.children[i]);
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
    filter(first) {
        let tags = arguments;
        let op = 'inclusive';
        if (typeof (first) == "object") {
            tags = first.tags;
            op = first.op;
        }

        let results = null;
        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            const curResults = this._tagMap[tag];

            if (curResults) {
                let oldResults = null;

                // If we already have some results, allow us to process exclusively.
                if (results != null && op == 'exclusive') {
                    oldResults = results;
                    results = {};
                }
                else { // Everything else is considered inclusive.
                    if (results == null)
                        results = {};
                }

                // Add each in.
                for (let j = 0; j < curResults.length; j++) {
                    const objId = curResults[j];

                    // If we have no old results to compare against, or if we exist in old results,
                    // we can be added.
                    if(oldResults == null || oldResults.hasOwnProperty(objId)) {
                        results[objId] = objId;
                    }
                }
            }
        }

        const ret = [];
        if (results) {
            for (let id in results)
                ret.push(this._gameObjects[id]);
        }
        return ret;
    }

    addTag(objId) {
        addTags(objId);
    }

    addTags(objId) {
        // First translate to the actual object.
        let obj = objId
        if (typeof (obj) === "number")
            obj = this._gameObjects[obj];

        for (let i = 1; i < arguments.length; i++) {
            const tag = arguments[i].toString();

            // Add the tag onto the object's tags.
            if (obj.tags) {

                // Only allow the tag once in our list.
                if (obj.tags.indexOf(tag) == -1)
                    obj.tags.push(tag);
            }
            else {
                obj.tags = [tag];
            }
            // Then add into the tag map.
            if (!this._tagMap[tag])
                this._tagMap[tag] = [];

            // Only allow the objId once in a list for any one tag.
            if(this._tagMap[tag].indexOf(obj.id) == -1)
                this._tagMap[tag].push(obj.id);
        }
    }

    removeTag(objId) {
        removeTags(objId);
    } 

    removeTags(objId) {
        // First translate to the actual object.
        let obj = objId
        if (typeof (obj) === "number")
            obj = this._gameObjects[obj];

        for (let i = 1; i < arguments.length; i++) {
            const tag = arguments[i].toString();

            // Remove the tag from the object's tags.
            if (obj.tags) {
                let index = obj.tags.indexOf(tag);
                if (index >= 0) {
                    obj.tags.splice(index, 1);
                }
            }

            // Then remove from the tag map.
            if (this._tagMap[tag]) {
                let index = this._tagMap[tag].indexOf(obj.id);
                if (index >= 0) {
                    this._tagMap[tag].splice(index, 1);
                }

                // Remove this tag completely if no one has it.
                if(this._tagMap[tag].length == 0)
                    delete this._tagMap[tag];
            }
        }
    }

    moveGameObject(id, newParent, callback) {
        if (id == 0 || id.id == 0)
            throw "Cannot move the root object.";

        // We want to be dealing with the ID.
        if(typeof(id) === 'object') {
            id = id.id;
        }

        // Make sure obj is part of the game, and that parent is.
        const obj = this._gameObjects[id];
        if (!obj)
            throw "The specified object has not yet been added into the game.";

        if (!this._gameObjects[parent.id])
            throw "The specified parent has not yet been added into the game.";

        if(!this._removeList.has(id))
            throw "The specified object is scheduled for removal and cannot be moved.";

        let p = new Promise((resolve, reject) => {
            this._moveList.set(id, { obj: obj, parent: newParent, resolve: resolve, reject: reject });
        });

        if(callback) {
            p = p.then((obj) => {
                callback(obj);

                return obj;
            });
        }
        return p;
    }

    // Adds the specified object into the game, including any tags. If a parent is specified, the object
    // is added to the parent in the object hierarchy. If the object contains children, those children are
    // also properly added.
    addGameObject(obj, parent, callback) {
        // Make sure obj is not part of the game, and that parent is.
        if (obj.id && this._gameObjects[obj.id])
            throw "The specified object to add has an id of '" + obj.id + "' and is already part of the game.";

        // Parent is allowed to not be part of the game yet.
        // (For instance adding a parent, and then a child in the same frame)
        if(typeof(parent) === 'function') {
            parent = 0;
            callback = parent;
        } else if(typeof(parent) === 'number') {
            if(!this._gameObjects[parent])
                throw "The specified parent has not yet been added into the game.";
        } else if(typeof(parent) === 'undefined' || parent == null) {
            parent = 0;
        } else if(typeof(parent === 'object')) {
            if(parent.id) {
                // If the ID is valid, just use that.
                if(this._gameObjects[parent.id])
                    parent = parent.id;
                // Otherwise, we'll assume the parent is waiting to be added.                
            }
        } else {
            throw "The specified parent is not a valid parent object.";
        }

        // At this point parent is either an ID that exists in the tree,
        // or an object that doesn't yet.

        let p = new Promise((resolve, reject) => {
            this._addingList.push({ obj: obj, parent: parent, resolve: resolve, reject: reject });
        });
        if(callback) {
            p = p.then((obj) => {
                callback(obj);

                return obj;
            });
        }

        return p;
    }

    removeGameObject(id, callback) {
        if(id == 0 || id.id == 0)
            throw "Cannot remove the root object from game.";

        if(typeof(id) === 'object')
            id = id.id;

        const obj = this._gameObjects[id];
        // Cannot remove an object that isn't already in the game.
        if (!obj)
            throw "The specified object has not yet been added into the game.";

        // Cannot remove an object that is being moved.
        if(this._moveList.has(id))
            throw "The specified object is scheduled for being moved and cannot be removed.";

        let p = new Promise((resolve, reject) => {
            this._removingList.set(id, { obj: obj, resolve: resolve, reject: reject });
        });
        
        if(callback) {
            p = p.then((obj) => {
                callback(obj);

                return obj;
            });
        }
        return p;
    }

    setTimeScale(tScale) {
        this._timeScale = tScale;
    }

    onGameObjectAdded(obj) {

    }

    onGameObjectRemoved(obj) {

    }

    onGameObjectMoved(obj) {

    }

    addInputController(controller) {
        this._inputControllers.push(controller);
    }

    removeInputController(controller) {
        // Can't do it for now
    }


    /* Private Functions */

    _addGameObject(obj, parent, resolve, reject) {

        // Find the parent object.
        let parentId = 0;
        if(typeof(parent) === 'number')
            parentId = parent;
        else if(typeof(parent) === 'object')
            parentId = parent.id;
        
        parent = this._gameObjects[parentId];

        if(!parent) {
            // The parent may have been removed before it could be added. In this case just return.
            reject("Parent does not exist");
            return;
        }

        const toAdd = [{ obj: obj, parent: parent }];

        const added = [];
        while (toAdd.length > 0) {

            const cur = toAdd.pop();

            let id = null;
            // Generate the next available Id.
            {
                // Verify it is available
                while (id == null || this._gameObjects[id] === 'undefined') {
                    // Increment (with overflow looping)
                    if (this._curId == Number.MAX_VALUE)
                        this._curId == Number.MIN_VALUE;
                    else
                        this._curId = this._curId + 1;
                    id = this._curId;
                }
            }
            cur.obj.id = id;

            // Add to the _gameObjects.
            this._gameObjects[cur.obj.id] = cur.obj;
            added.push[cur.obj];

            // Add to the _gameTree.
            if (!cur.parent.children)
                cur.parent.children = [];
            cur.parent.children.push(cur.obj.id);
            cur.obj.parentId = cur.parent.id;

            // Add in any tags.
            if (cur.obj.tags) {
                const args = cur.obj.tags;
                delete cur.obj.tags;
                args.unshift(cur.obj);
                this.addTags.apply(this, args);
            }
            if (cur.obj.classTags) { // Check their 'object level tags' too, but don't delete them.
                const args = cur.obj.classTags.slice(0);
                args.unshift(cur.obj);
                this.addTags.apply(this, args);
            }

            // Then process any children specified.
            if (cur.obj.children != null) {
                for (let c = 0; c < cur.obj.children.length; c++) {
                    const child = cur.obj.children[c]
                    toAdd.push({ obj: child, parent: cur.obj });
                }
                // Clear out children now that we're part of the tree.
                cur.obj.children = [];
            }
        }

        for(let x=0;x<added.length;x++) {
            this.onGameObjectAdded(added[x]);
            if(this._onGameObjectAdded)
                this._onGameObjectAdded(added[x]);
        }
        resolve(obj);
    }

    _removeGameObject(obj, resolve, reject) {

        // If it doesn't exist, it has already been removed.
        // This will typically be because the parent was removed.
        // No need to fire events, since it was already removed and an event fired
        // for it.
        if(!this._gameObjects[obj.id]) {
            resolve(obj)
            return;
        }

        const toRemove = [obj];
        
        const removed = [];

        // Process depth first, removing children before parents.
        while (toRemove.length > 0) {

            let obj = toRemove[toRemove.length - 1];

            // Go through children and remove them first.
            if (obj.children && obj.children.length > 0) {
                for (let c = 0; c < obj.children.length; c++) {
                    toRemove.push(this._gameObjects[obj.children[c]]);
                }
            } else {
                // This one has no children and is ready to be removed.
                obj = toRemove.pop();

                // Remove tags.
                if (obj.tags && obj.tags.length > 0) {
                    const args = obj.tags.splice(0);
                    args.unshift(obj);
                    this.removeTags.apply(this, args);
                }

                // Remove from tree

                // First remove from parent's children collection
                const parent = this._gameObjects[obj.parentId];
                if(parent != null) {
                    const index = parent.children.indexOf(obj.id);
                    if (index > -1)
                        parent.children.splice(index, 1);
                    // Then remove parent reference.
                    delete obj.parentId;
                }


                // Remove from game objects
                delete this._gameObjects[obj.id];

                removed.push(obj);
            }
        }
        
        for(let x=0;x<removed.length;x++) {
            this.onGameObjectRemoved(removed[x]);
            if(this._onGameObjectRemoved)
                this._onGameObjectRemoved(removed[x]);
        }
        resolve(obj);
    }

    
    _moveGameObject(obj, parentId, resolve, reject) {

        const id = obj.id;
        const newParent = this._gameObjects[parentId];

        let oldParent = null;

        let p = null;
        // If it doesn't exist, it has already been removed.
        if(!newParent) {
            // If our target parent was removed, then we can treated
            // this as a normal 'remove'.

            p = new Promise((resolve, reject) => {
                this._removeGameObject(id, resolve, reject);
            });
        } 
        // Look up by id. This helps us check if it still exists or not.
        // If it doesn't exist, it has already been removed.
        else if(!this._gameObjects[id]) {
            // So in this case, we need to just be treated as an add to the parent.
            // Chances are, our parent was removed and us with it.
            p = new Promise((resolve, reject) => {
                this._addGameObject(obj, parentId, resolve, reject);
            });
        } else {

            // Should be as easy as taking the object, and changing it's parents.
            // The children should all stay the same.
             oldParent = this._gameObjects[obj.parentId];
            if(parent != null) {
                const index = oldParent.children.indexof(id);
                if(index > -1)
                    parent.children.splice(index, 1);
            }

            // Add to new parent.
            newParent.children.push(id);

            // Update parent reference.
            obj.parentId = parentId;
        }        

        if(p) {
            p.then(() => {
                this.onGameObjectMoved(obj, oldParent, newParent);
                if(this._onGameObjectMoved)
                    this._onGameObjectMoved(obj, oldParent, newParent);

                resolve(obj);
            })
            .catch((exception) => {
                reject(exception);
            });
        } else {
            this.onGameObjectMoved(obj, oldParent, newParent);
            if(this._onGameObjectMoved)
                this._onGameObjectMoved(obj, oldParent, newParent);

            resolve(obj);
        }
    }

    

    _start() {

        if (this._running)
            return;

        // Begin our loop.
        let gameLoop = null;
        let lastTime = null;
		let updateTime = 0;
        let animationTime = 0;
        gameLoop = function () {

            if (!this._running)
                return;

            if (lastTime == null)
                lastTime = new Date().getTime();

            const curTime = new Date().getTime();

            const elapsed = curTime - lastTime;
            lastTime = curTime;			

			// Process user input.
			this._processInput();
		
			if (!this._paused) {

                // tDelta should be in terms of seconds, so convert from ms.
                let tDelta = this._minUpdateTime/1000 * this._timeScale;
			
				// Only count in updateTime if we aren't paused.
				updateTime += elapsed;
                animationTime += elapsed;

                // If it is taking us too long, just skip some updates.
                // :(
                if(updateTime > this._minUpdateTime*100)
                    updateTime = 0;

				while(updateTime >= this._minUpdateTime) {
					// Update the world
					this._update(tDelta);
					updateTime -= this._minUpdateTime;
				}
			}

			// Repaint the world.
			this._refresh({
                timeAdvance: updateTime/1000 * this._timeScale,
                timeScale: this._timeScale,
                animationTime: animationTime,
                curTime: curTime,
                lastTime: lastTime
            });

            // Loop again.
            this._curFrame = window.requestAnimationFrame(gameLoop);
        }.bind(this);

        this._running = true;
        this._curFrame = window.requestAnimationFrame(gameLoop);
    }

    _stop() {
        if (!this._running)
            return;

        this._running = false;
        if (this._curFrame != null)
            window.cancelAnimationFrame(this._curFrame);

    }

	_processInput() {
        // update all controllers, which will trigger any necessary binds.
        for(let i = 0; i < this._inputControllers.length; i++) {
            this._inputControllers[i].update();
        }
	}
	
    _update(tDelta) {

        this.traverse(this._gameTree, function (obj) {

            // Now execute the update of the object (if it wants to be).
            if (obj.update) {
                obj.update(tDelta);
            }

            // If the object has the 'avoidChildrenUpdate' flag, then we
            // should not add the children
            return !obj.avoidChildrenUpdate;
        });

        // Once we're done updating, go ahead and add or remove objects.
        // Order shouldn't matter here, but we'll remove, move, then add.
        for (let [key, value] of this._removingList) {
            this._removeGameObject(value.obj, value.resolve, value.reject);
        }
        for (let [key, value] of this._moveList) {
            this._moveGameObject(value.obj, value.parent, value.resolve, value.reject);
        }
        for (let a = 0; a < this._addingList.length; a++) {
            const obj = this._addingList[a];
            this._addGameObject(obj.obj, obj.parent, obj.resolve, obj.reject);
        }
        this._removingList.clear();
        this._moveList.clear();
        this._addingList = [];
    }

    _refresh(time) {

        // Find all (enabled) cameras.
        const cameraObjects = this.filter("camera").filter((c) => !c.isDisabled);
        // Render everything for each camera.
        for (let index in cameraObjects) {
            const camera = cameraObjects[index];

            this._refreshCamera(time, camera);
        }

        for (let index in cameraObjects) {
            const camera = cameraObjects[index];
            if(camera.drawDoubleBuffer) {
                // Once we're done drawing, draw us to the swap buffer, if we're doing that.
                camera.drawDoubleBuffer();
            }
        }
    }

    _refreshCamera(time, camera){

        // Clear the camera.
        camera.clear();

        // calc the camera's view
        camera.calculateView(time);

        // Now traverse our tree in order to draw each object.
        // We won't use the Traverse call for this one, as we need more control over pushes an pops
        // by adding context restores.

        // Updates will be a depth first traversal of the _gameTree.
        const drawGroup = [{ id: this._gameTree.id }];

        // Begin traversal.
        while (drawGroup.length > 0) {
            // Grab the next draw request.
            const drawReq = drawGroup.pop();
            // Is this an object?
            if(typeof(drawReq.id) === 'number') {

                // Evaluate to the object
                const obj = this._gameObjects[drawReq.id];

                // First push a restore, if we will be updating.
                if (obj.draw || (this.debug && obj.debugDraw))
                    drawGroup.push({ isRestore: true });

                // If the object has the 'avoidChildrenDrawing' flag, then we
                // should not add the children
                if (!obj.avoidChildrenDrawing && obj.children) {

                    // Check if children should be sorted first.
                    let children = obj.children;
                    if(obj.childrenSort) {
                        // children is a list of object ids. we need these
                        // to be the actual objects instead.
                        let cObjs = obj.children.map((id) => {
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
                    for (let i = children.length-1; i >= 0; i--) {
                        
                        // Push the child.
                        drawGroup.push({ id: children[i]});
                    }
                }


                // Now execute the draw of the object (if it wants to be).
                if (obj.draw || (this.debug && obj.debugDraw)) {
                    camera.saveState(); // Always save if we're drawing.

                    // Do the drawing.
                    if(obj.draw)
                        camera.drawObject(obj, time);

                    // Do any debug drawing.
                    if(this.debug && obj.debugDraw) 
                        camera.debugDrawObject(obj, time);
                }
            }
            // Otherwise, it's a restore.
            else if (drawReq.isRestore) {
                camera.restoreState();
            }
        }
    }
}