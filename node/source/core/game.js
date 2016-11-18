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

        // The tree of all objects in the game for traversal when updating/drawing, and available for other processing.
        this._gameTree = { id:0, children: [] };
        // Map of all object Ids to the objects, prepopulated with the root.
        this._gameObjects = { 0: this._gameTree };
        // A map of tags to object Id lists for quick access/categorization outside of the tree.
        this._tagMap = {};

        this._addingList = [];
        this._removingList = [];

		if(properties.paused)
			this._paused = properties.paused;

		if(properties.timeScale)
			this._timeScale = properties.timeScale;

		if(properties.minUpdateTime)
			this._minUpdateTime = properties.minUpdateTime;

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

    moveGameObject(id, newParent) {
        if (id == 0 || id.id == 0)
            throw "Cannot move the root object.";

        // Make sure obj is part of the game, and that parent is.
        if (!this._gameObjects[id])
            throw "The specified object has not yet been added into the game.";

        if (!this._gameObjects[parent.id])
            throw "The specified parent has not yet been added into the game.";

        // Put in both the _addingList and removing list.
        this._removingList.push({ id: id, isMove: true });
        this._addingList.push({ obj: id, parent: newParent });
    }

    // Adds the specified object into the game, including any tags. If a parent is specified, the object
    // is added to the parent in the object hierarchy. If the object contains children, those children are
    // also properly added.
    addGameObject(obj, parent) {
        // Make sure obj is not part of the game, and that parent is.
        if (this._gameObjects[obj.id])
            throw "The specified object to add has an id of '" + obj.id + "' and is already part of the game.";

        this._addingList.push({ obj: obj, parent: parent });
    }

    removeGameObject(id) {
        if(id == 0 || id.id == 0)
            throw "Cannot remove the root object from game.";

        this._removingList.push({ id: id, isMove: false });
    }

    setTimeScale(tScale) {
        this._timeScale = tScale;
    }


    /* Private Functions */

    _addGameObject(obj, parent) {

        // If parent is an id, translate to the actual object
        if (typeof (parent) === "undefined" || parent == null)
            parent = this._gameTree; // Parent not specified, so stick us in the root.
        else if (typeof (parent) === "number") // ParentId, so translate
            parent = this._gameObjects[parent];
        else // Treat anything else as unspecified
            parent = this._gameTree;

        // The parent may have been removed before it could be added. In this case just return.
        if (!this._gameObjects[parent.id])
            return;

        const isMove = typeof (obj) === 'number';
        if (isMove)
            obj = this._gameObjects[obj];

        const toAdd = [{ obj: obj, parent: parent }];

        while (toAdd.length > 0) {

            const cur = toAdd.pop();

            // If it is a move, we don't need to generate an id, and we don't need to 
            // add to _gameObjects.
            if (!isMove) {
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
            }

            // Add to the _gameTree.
            if (!cur.parent.children)
                cur.parent.children = [];
            cur.parent.children.push(cur.obj.id);
            cur.obj.ParentId = cur.parent.id;

            // Tags should be already delt with as well.
            // Children should be set up properly since it is a move.
            if (!isMove) {
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
        }
    }

    _removeGameObject(id, isMove) {

        let rootObj = id;
        if (typeof (id) === 'object') {
            id = id.id;
        }
        else {
            rootObj = this._gameObjects[id];
        }

        // If it doesn't exist, it has already been removed.
        if(!rootObj)
            return;

        const toRemove = [rootObj];
        
        // Process depth first, removing children before parents.
        while (toRemove.length > 0) {

            let obj = toRemove[toRemove.length - 1];
            // We don't want to touch children if it is a move. They'll move with the parent.
            if (!isMove && obj.children && obj.children.length > 0) {
                for (let c = 0; c < obj.children.length; c++) {
                    toRemove.push(this._gameObjects[obj.children[c]]);
                }
            } else {
                // This one has no children (or is a move) and is ready to be removed.
                obj = toRemove.pop();

                // Remove tags.
                if (!isMove) { // No need to remove tags if it is a move.
                    if (obj.tags && obj.tags.length > 0) {
                        const args = obj.tags.splice(0);
                        args.unshift(obj);
                        this.removeTags.apply(this, args);
                    }
                }

                // Remove from tree

                // First remove from parent's children collection
                const parent = this._gameObjects[obj.ParentId];
                const index = parent.children.indexOf(obj.id);
                if (index >= 0)
                    parent.children.splice(index, 1);
                // Then remove parent reference.
                delete obj.ParentId;


                // Remove from game objects
                if (!isMove) // If it is a move, don't remove from _gameObjects
                    delete this._gameObjects[id];
            }
        }
    }

    _start() {

        if (this._running)
            return;

        // Begin our loop.
        let gameLoop = null;
        let lastTime = null;
		let updateTime = 0;
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
			
				// Only count in updateTime if we aren't paused.
				updateTime += elapsed;
				while(updateTime >= this._minUpdateTime) {
					// Update the world
					this._update();
					updateTime -= this._minUpdateTime;
				}
			}

			// Repaint the world.
			this._refresh(updateTime / this._minUpdateTime);

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
		// Check the user Action input queue for any changes
		// requested by the user, and transfer them into active game changes
		// to be later acted upon in the update loop.
	}
	
    _update() {

		// tDelta should be in terms of seconds, so convert from ms.
        let tDelta = this._minUpdateTime/1000 * this._timeScale;
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
        // Remove first then add, in case they wanted to move an object's location.
        for (let a = 0; a < this._removingList.length; a++) {
            this._removeGameObject(this._removingList[a].id, this._removingList[a].isMove);
        }
        for (let a = 0; a < this._addingList.length; a++) {
            this._addGameObject(this._addingList[a].obj, this._addingList[a].parent);
        }
        this._removingList = [];
        this._addingList = [];
    }

    _refresh(timeAdvance) {

        // Find all cameras.
        const cameraObjects = this.filter("camera");
        // Render everything for each camera.
        for (let index in cameraObjects) {
            const camera = cameraObjects[index];

            this._refreshCamera(timeAdvance * this._timeScale, camera);
        }

        for (let index in cameraObjects) {
            const camera = cameraObjects[index];
            if(camera.drawDoubleBuffer) {
                // Once we're done drawing, draw us to the swap buffer, if we're doing that.
                camera.drawDoubleBuffer();
            }
        }
    }

    _refreshCamera(timeAdvance, camera){

        if (camera.isDisabled)
            return;

        // Clear the camera.
        camera.clear();

        // calc the camera's view
        camera.calculateView(timeAdvance);

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
                    // Otherwise, add it's children in.
                    // Push children into the front so we can continue depth first
                    // (in reverse so their popped in the correct order)
                    for (let i = obj.children.length - 1; i >= 0; i--) {
                        
                        // Push the child.
                        drawGroup.push({ id: obj.children[i]});
                    }
                }


                // Now execute the draw of the object (if it wants to be).
                if (obj.draw || (this.debug && obj.debugDraw)) {
                    camera.saveState(); // Always save if we're drawing.

                    // Do the drawing.
                    if(obj.draw)
                        camera.drawObject(obj, timeAdvance);

                    // Do any debug drawing.
                    if(this.debug && obj.debugDraw) 
                        camera.debugDrawObject(obj, timeAdvance);
                }
            }
            // Otherwise, it's a restore.
            else if (drawReq.isRestore) {
                camera.restoreState();
            }
        }
    }
}