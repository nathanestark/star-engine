import EventEmitter, { EventMap } from "./event-emitter";
import Game from "./game";
import { RefreshTime } from "./types";
import Camera from "./camera";

export interface GameObjectEventTypes extends EventMap {
    gameObjectAdded: [obj: GameObject];
    gameObjectRemoved: [obj: GameObject];
    gameObjectMoved: [obj: GameObject, oldParent: GameObject, newParent: GameObject];
}

export default class GameObject<
    T_EventMap extends GameObjectEventTypes = GameObjectEventTypes
> extends EventEmitter<T_EventMap> {
    _id?: number;

    _game: Game;
    _removed: boolean = false;
    _initialParent?: GameObject;
    _initialChildren?: Array<GameObject>;
    _parent?: number;
    _children?: Array<number>;

    _tags?: Array<string>;
    _initialTags?: Array<string>;
    classTags?: Array<string>;

    avoidChildrenUpdate?: boolean;
    avoidChildrenDrawing?: boolean;

    update?(time: RefreshTime): void;
    allowDraw?(camera: Camera): boolean;
    draw?(camera: Camera, time: RefreshTime): void;
    debugDraw?(camera: Camera, time: RefreshTime): void;

    childrenSort?(camera: Camera, childObjects: Array<GameObject>): Array<GameObject>;

    gameObjectAdded(): void {
        this.emit("gameObjectAdded", this);
    }
    gameObjectRemoved?(): void {
        this.emit("gameObjectRemoved", this);
    }
    gameObjectMoved?(oldParent: GameObject, newParent: GameObject): void {
        this.emit("gameObjectMoved", this, oldParent, newParent);
    }

    constructor() {
        super();
    }

    get active() {
        return this._id && this._game && this._game.getGameObject(this._id) == this;
    }

    get id() {
        return this._id;
    }

    set id(id: number) {
        if (this._id) throw "Cannot reassign id";

        this._id = id;
    }

    get game(): Game {
        return this._game;
    }

    get parent(): GameObject {
        if (!this.active) return this._initialParent;

        return this._game.getGameObject(this._parent);
    }

    set parent(parent: GameObject) {
        if (this.active) throw "Use `moveGameObject` on Game to move GameObjects";

        this._initialParent = parent;
    }

    get children(): Array<GameObject> {
        if (!this.active) return this._initialChildren;

        return this._children.map((id) => this._game.getGameObject(id));
    }

    set children(children: Array<GameObject>) {
        if (this.active) throw "Use `addGameObject` on Game to add GameObjects as children";

        this._initialChildren = children;
    }

    get tags(): Array<string> {
        if (!this.active && !this._removed) return this._initialTags;

        return this._tags;
    }

    set tags(tags: Array<string>) {
        if (this.active) throw "Use `addTags` on Game to add tags to GameObjects";

        this._initialTags = tags;
    }
}
