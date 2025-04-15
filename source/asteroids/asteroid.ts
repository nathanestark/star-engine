import GameBaseObject, { GameBaseObjectProperties } from "./game-base-object";
import Bullet from "./bullet";
import Ship from "./ship";
import {
    CircleColliderResult,
    ColliderResult
} from "source/canvas-2d/collision-detection/collider-operations";

export interface AsteroidProperties extends GameBaseObjectProperties {
    onDestroyed?: (obj: Asteroid) => void;
}

export default class Asteroid extends GameBaseObject {
    _onDestroyed: (obj: Asteroid) => void;

    constructor({ onDestroyed, ...superProps }: AsteroidProperties = {}) {
        super({ ...{ color: "#fff" }, ...superProps });
        this.classTags.push("asteroid");

        if (onDestroyed) this._onDestroyed = onDestroyed;
    }

    onDestroyed() {
        if (this._onDestroyed) this._onDestroyed(this);
    }

    onCollision(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (!(otherObj.owner instanceof Asteroid)) super.onCollision(thisObj, otherObj);
    }

    onCollided(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (this.removed) return;

        if (otherObj.owner instanceof Bullet || otherObj.owner instanceof Ship) {
            this.removed = true;
            this.game.removeGameObject(this);
            this.onDestroyed();
        } else if (!(otherObj.owner instanceof Asteroid)) {
            super.onCollided(thisObj, otherObj);
        }
    }
}
