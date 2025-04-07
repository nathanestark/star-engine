export default class Resources {
    constructor() {
        this._curId = 0;

        this._nameMap = new Map();
        this._idMap = new Map();
    }

    get(resource) {
        if (typeof resource === "number") return this._idMap.get(resource);
        else return this._nameMap.get(resource);
    }

    load(resources) {
        if (!(resources instanceof Array)) resources = [resources];

        const promises = [];
        for (let i = 0; i < resources.length; i++) {
            if (resources[i].type == "image")
                promises.push(this.loadImage(resources[i].path, resources[i].names));
            else throw "Unknown resource type '" + resources[i].type + "'";
        }

        return Promise.all(promises);
    }
    /*
    unload(id) {
        if(typeof(id) === 'string') {
            id = this._nameMap.get(id);
        }
    }
*/
    loadImage(path, names) {
        let obj = this._nameMap.get(path);
        if (obj) {
            return new Promise((resolve) => {
                resolve(obj);
            });
        } else {
            const obj = {
                id: this._generateId(),
                type: "image",
                path: path,
                image: new Image(),
                loaded: false,
                names: []
            };

            this._nameMap.set(obj.path, obj);
            this._idMap.set(obj.id, obj);

            for (let i = 0; i < names.length; i++) {
                const res = this._nameMap.get(name[i]);
                if (res)
                    throw (
                        "Cannot use name '" +
                        names[i] +
                        "' for resource '" +
                        obj.path +
                        "': name already exists for resource '" +
                        res.path +
                        "'."
                    );
                this._nameMap.set(names[i], obj);
            }

            return new Promise((resolve, reject) => {
                if (obj.image.onload) {
                    obj.image.onload = function () {
                        obj.loaded = true;
                        resolve(obj);
                    };
                } else {
                    obj.image.addEventListener(
                        "load",
                        function () {
                            obj.loaded = true;
                            resolve(obj);
                        },
                        false
                    );
                }
                if (obj.image.onerror) {
                    obj.image.onerror = function () {
                        reject("Failed to load image '" + obj.path + "'");
                    };
                } else {
                    obj.image.addEventListener(
                        "error",
                        function () {
                            reject("Failed to load image '" + obj.path + "'");
                        },
                        false
                    );
                }
                obj.image.src = obj.path;
            });
        }
    }

    _generateId() {
        // Generate the next available Id.
        let id = null;
        // Verify it is available
        while (id == null || this._idMap[id] === "undefined") {
            // Increment (with overflow looping)
            if (this._curId == Number.MAX_VALUE) this._curId == Number.MIN_VALUE;
            else this._curId = this._curId + 1;
            id = this._curId;
        }
        return id;
    }
}
