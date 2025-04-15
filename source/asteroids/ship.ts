import { vec2, vec3, quat } from "gl-matrix";
import GameBaseObject, { GameBaseObjectProperties } from "./game-base-object";
import Bullet from "./bullet";
import {
    CircleColliderResult,
    ColliderResult
} from "source/canvas-2d/collision-detection/collider-operations";
import DefaultCamera from "./default-camera";
import { RefreshTime } from "source/core/types";

export interface ShipProperties extends GameBaseObjectProperties {
    name?: string;
    color?: string;
    onDestroyed?: (obj: Ship) => void;
}

export default class Ship extends GameBaseObject {
    name: string;
    _thrust: number;
    _rotate: number;
    _firing: boolean;
    _fireRecord: number;
    _fireInterval: NodeJS.Timeout;
    _onDestroyed?: (obj: Ship) => void;

    constructor({ name, onDestroyed, ...superProps }: ShipProperties = {}) {
        super({
            ...{
                mass: 10,
                radius: 10,
                color: "#F00",
                rotation: 0
            },
            ...superProps
        });
        this.classTags.push("ship");
        this._thrust = 0;
        this._rotate = 0;

        this._firing = false;
        this._fireRecord = 0;

        this.name = "";
        if (name) this.name = name;

        if (onDestroyed) this._onDestroyed = onDestroyed;
    }

    onDestroyed() {
        clearInterval(this._fireInterval);
        this._firing = false;
        this._thrust = 0;
        this._rotate = 0;

        if (this._onDestroyed) this._onDestroyed(this);
    }

    fire(on: boolean) {
        if (on && !this._firing) {
            this.fireNow();
            this._fireInterval = setInterval(() => {
                this.fireNow();
            }, 150);
        } else {
            this._firing = false;
            clearInterval(this._fireInterval);
        }
    }

    fireNow() {
        if (this._fireRecord >= 4) return;
        this._fireRecord++;
        setTimeout(() => {
            this._fireRecord--;
        }, 1000);

        const temp = vec3.fromValues(1, 0, 0);
        const rotQuat = quat.identity(quat.create());
        quat.rotateZ(rotQuat, rotQuat, this.rotation);
        vec3.transformQuat(temp, temp, rotQuat);

        const position = vec2.clone(this.position);
        const velocity = vec2.fromValues(temp[0], temp[1]);
        vec2.scale(velocity, velocity, 300);
        vec2.add(velocity, velocity, this.velocity);
        const bullet = new Bullet({
            position: position,
            velocity: velocity
        });
        bullet.owner = this;

        const game = this.game;
        game.addGameObject(bullet, this.parent);
        setTimeout(() => {
            if (!bullet.removed) game.removeGameObject(bullet);
        }, 500);
    }

    thrust(on: boolean) {
        this._thrust = on ? 1000 : 0;
        if (on) {
            super.startAnimation("thrust");
        } else {
            super.stopAnimation();
        }
    }

    rotateCounterClockwise(on: boolean) {
        this._rotate = on ? -0.06 : 0;
    }

    rotateClockwise(on: boolean) {
        this._rotate = on ? 0.06 : 0;
    }

    update(tDelta: number) {
        // Add our rotation
        this.rotation += this._rotate;

        // Add our thrust to force.
        if (this._thrust != 0) {
            // Determine what direction we're facing.

            const temp = vec3.fromValues(this._thrust, 0, 0);
            const rotQuat = quat.identity(quat.create());
            quat.rotateZ(rotQuat, rotQuat, this.rotation);
            vec3.transformQuat(temp, temp, rotQuat);

            vec2.add(this.totalForce, this.totalForce, vec2.fromValues(temp[0], temp[1]));
        }

        super.update(tDelta);
    }

    onCollided(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (this.removed) return;

        const myBullet = otherObj.owner instanceof Bullet && otherObj.owner.owner == this;
        if (otherObj.owner instanceof GameBaseObject && !myBullet) {
            this.removed = true;
            this.game.removeGameObject(this);
            this.onDestroyed();
        } else {
            super.onCollided(thisObj, otherObj);
        }
    }

    draw(camera: DefaultCamera, time: RefreshTime) {
        super.draw(camera, time);
    }
}
