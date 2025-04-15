export interface Resource {
    id?: number;
    path: string;
    names: Array<string>;
    type: "image";

    image?: HTMLImageElement;
    bitmap?: ImageBitmap;
    loaded?: boolean;
}

export default class Resources {
    _curId: number;
    _nameMap: Map<string, Resource>;
    _idMap: Map<number, Resource>;

    constructor() {
        this._curId = 0;

        this._nameMap = new Map();
        this._idMap = new Map();
    }

    get(resourceId: number): Resource | undefined;
    get(resourceName: string): Resource | undefined;
    get(resource: number | string): Resource | undefined {
        if (typeof resource === "number") return this._idMap.get(resource);
        else return this._nameMap.get(resource);
    }

    async load(resource: Resource): Promise<Array<Resource>>;
    async load(resources: Array<Resource>): Promise<Array<Resource>>;
    async load(resources: Resource | Array<Resource>): Promise<Array<Resource>> {
        let lResources: Array<Resource> = [];
        if (resources instanceof Array) lResources = resources as Array<Resource>;
        else lResources = [resources as Resource];

        const promises: Array<Promise<Resource>> = [];
        for (let i = 0; i < lResources.length; i++) {
            const resource = lResources[i];
            if (resource.type == "image")
                promises.push(this.loadImage(resource.path, resource.names));
            else throw "Unknown resource type '" + resource.type + "'";
        }

        return await Promise.all(promises);
    }
    /*
    unload(id) {
        if(typeof(id) === 'string') {
            id = this._nameMap.get(id);
        }
    }
*/
    async loadImage(path: string, names: Array<string>): Promise<Resource> {
        let obj = this._nameMap.get(path);
        if (obj) {
            return obj;
        } else {
            obj = {
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
                const name = names[i];
                const res = this._nameMap.get(name);
                if (res)
                    throw `Cannot use name '${name}' for resource '${obj.path}': name already exists for resource '${res.path}'.`;
                this._nameMap.set(name, obj);
            }

            return new Promise((resolve, reject) => {
                const finishLoad = () => {
                    obj.loaded = true;
                    createImageBitmap(obj.image).then((bitmap) => {
                        obj.bitmap = bitmap;
                        resolve(obj);
                    });
                };
                if (obj.image.onload) {
                    obj.image.onload = finishLoad;
                } else {
                    obj.image.addEventListener("load", finishLoad, false);
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
        while (id == null || typeof this._idMap.get(id) !== "undefined") {
            // Increment (with overflow looping)
            if (this._curId == Number.MAX_VALUE) this._curId == Number.MIN_VALUE;
            else this._curId = this._curId + 1;
            id = this._curId;
        }
        return id;
    }
}
