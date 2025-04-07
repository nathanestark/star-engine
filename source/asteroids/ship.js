import { vec2, vec3, quat } from "gl-matrix";
import GameBaseObject from "./game-base-object";
import Bullet from "./bullet";

export default class Ship extends GameBaseObject {
    constructor(game, properties = {}) {
        super(
            game,
            (properties = Object.assign(
                {
                    mass: 10,
                    radius: 10
                },
                properties
            ))
        );
        this.classTags.push("ship");
        this.color = "#F00";
        this.rotation = 0;
        this._thrust = 0;
        this._rotate = 0;

        this._firing = false;
        this._fireRecord = 0;

        this.name = "";
        if (properties.name) this.name = properties.name;

        if (properties.color) this.color = properties.color;

        if (properties.onDestroyed) this._onDestroyed = properties.onDestroyed;
    }

    onDestroyed() {
        clearInterval(this._fireInterval);
        this._firing = false;
        this._thrust = 0;
        this._rotate = 0;

        if (this._onDestroyed) this._onDestroyed(this);
    }

    fire(on) {
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
        const bullet = new Bullet(this.game, {
            position: position,
            velocity: velocity
        });
        bullet.owner = this;

        this.game.addGameObject(bullet, this.parent);
        setTimeout(() => {
            if (!bullet.removed) this.game.removeGameObject(bullet);
        }, 500);
    }

    thrust(on) {
        this._thrust = on ? 1000 : 0;
        if (on) {
            super.startAnimation("thrust");
        } else {
            super.stopAnimation();
        }
    }

    rotateCounterClockwise(on) {
        this._rotate = on ? -0.06 : 0;
    }

    rotateClockwise(on) {
        this._rotate = on ? 0.06 : 0;
    }

    update(tDelta) {
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

    onCollided(thisObj, otherObj) {
        if (this.removed) return;

        const myBullet = otherObj.parent instanceof Bullet && otherObj.parent.owner == this;
        if (otherObj.parent instanceof GameBaseObject && !myBullet) {
            this.removed = true;
            this.game.removeGameObject(this);
            this.onDestroyed();
        } else {
            super.onCollided(thisObj, otherObj);
        }
    }

    draw(time, camera, context) {
        super.draw(time, camera, context);
    }
}
