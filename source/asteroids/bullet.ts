import {
    CircleColliderResult,
    ColliderResult
} from "source/canvas-2d/collision-detection/collider-operations";
import * as Math2D from "../canvas-2d/math-2d";
import GameBaseObject, { GameBaseObjectProperties } from "./game-base-object";
import Ship from "./ship";
import { RefreshTime } from "source/core/types";
import DefaultCamera from "./default-camera";

export interface BulletProperties extends GameBaseObjectProperties {
    mass?: number;
    radius?: number;
    color?: string;
}

export default class Bullet extends GameBaseObject {
    owner: GameBaseObject;

    constructor({ color, ...superProps }: BulletProperties = {}) {
        super({
            ...{
                mass: 0.1,
                radius: 2
            },
            ...superProps
        });
        this.classTags.push("bullet");
        this.color = "#860";

        if (color) this.color = color;
    }

    onCollided(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (this.removed) return;

        const myParent = otherObj.owner instanceof Ship && otherObj.owner == this.owner;
        if (otherObj.owner instanceof GameBaseObject && !myParent) {
            this.removed = true;
            this.game.removeGameObject(this);
        } else {
            super.onCollided(thisObj, otherObj);
        }
    }

    draw(camera: DefaultCamera, _time: RefreshTime) {
        camera.context.translate(this.position[0], this.position[1]);
        camera.context.rotate(this.rotation);

        camera.context.fillStyle = this.color;
        camera.context.beginPath();

        camera.context.arc(0, 0, this.radius, 0, Math2D.twoPi);
        camera.context.fill();
    }
}
