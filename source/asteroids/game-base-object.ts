import { vec2 } from "gl-matrix";
import CircleCollider, { CircleCollidable } from "../canvas-2d/collision-detection/circle-collider";
import DrawBaseObject, { DrawBaseObjectProperties } from "./draw-base-object";
import * as Math2D from "../canvas-2d/math-2d";
import { GameObject2D } from "source/canvas-2d/types";
import { Collidable, ICollider } from "source/canvas-2d/collision-detection/collider";
import {
    CircleColliderResult,
    ColliderResult
} from "source/canvas-2d/collision-detection/collider-operations";
import DefaultCamera from "./default-camera";
import { RefreshTime } from "source/core/types";

export interface GameBaseObjectProperties extends DrawBaseObjectProperties {
    velocity?: vec2;
    mass?: number;
    elasticity?: number;
}

export default class GameBaseObject extends DrawBaseObject implements GameObject2D, Collidable {
    velocity: vec2;
    totalForce: vec2;
    mass: number;
    elasticity: number;
    minSpeed: number;
    removed: boolean;

    _collider: CircleCollider;

    constructor({ velocity, mass, elasticity, ...superProps }: GameBaseObjectProperties = {}) {
        super({
            ...{
                radius: 1,
                position: vec2.create(),
                rotation: 0
            },
            ...superProps
        });
        this.classTags = ["gamebase"];
        this.totalForce = vec2.create();

        if (velocity) this.velocity = velocity;
        else this.velocity = vec2.create();

        if (typeof mass == "number") this.mass = mass;
        else this.mass = 1;

        if (typeof elasticity == "number") this.elasticity = elasticity;
        else this.elasticity = 1;

        // Add a collider as a child.
        this._collider = new CircleCollider(this);

        this.children = [this._collider];
    }

    update(tDelta: number) {
        // Apply our total force to our velocity.
        vec2.scale(this.totalForce, this.totalForce, tDelta / this.mass);
        vec2.add(this.velocity, this.velocity, this.totalForce);

        let sqrSpeed = vec2.sqrLen(this.velocity);
        // Check if our velocity falls below epsilon.
        if (sqrSpeed <= this.minSpeed * this.minSpeed) {
            vec2.set(this.velocity, 0, 0);
            sqrSpeed = 0;
        }

        // Apply our velocity to our position, but don't destroy velocity.
        if (sqrSpeed > 0) {
            const vel = vec2.clone(this.velocity);
            vec2.scale(vel, vel, tDelta);
            vec2.add(this.position, this.position, vel);
        }
        // Reset force.
        this.totalForce = vec2.create();
    }

    onCollision(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (this.removed) return;

        //collider: collider1,
        //parent: collider1.parent,
        //position: pos1,
        //normal: norm1,
        //velocity: vec2.clone(collider1.velocity),
        //timeLeft: t,
        //radius: collider1.radius,

        const normal = thisObj.normal;

        // On collision, we want the asteroid to bounce.
        const temp = vec2.create();

        const cOtherObj = otherObj as CircleColliderResult;

        if (otherObj && otherObj.owner instanceof GameBaseObject) {
            // Calculate new velocity for after the collision, and update our velocity.
            Math2D.calculateElasticCollisionVelocity(
                this.velocity,
                this.velocity,
                normal,
                this.elasticity * (cOtherObj.owner as GameBaseObject).elasticity,
                thisObj.velocity,
                (thisObj.owner as GameBaseObject).mass,
                cOtherObj.velocity,
                (cOtherObj.owner as GameBaseObject).mass
            );
        } else {
            Math2D.calculateElasticCollisionVelocity(
                this.velocity,
                this.velocity,
                normal,
                this.elasticity,
                thisObj.velocity,
                (thisObj.owner as GameBaseObject).mass
            );
        }

        // Finally calculate new position based off of collision position,
        // new velocity and negated timeLeft.
        vec2.scale(temp, this.velocity, thisObj.timeLeft);
        vec2.add(this.position, thisObj.position, temp);
    }

    onCollided(thisObj: CircleColliderResult, otherObj: ColliderResult) {
        if (this.removed || (otherObj.owner as GameBaseObject).removed) return;

        if (otherObj.owner instanceof GameBaseObject) {
            const cOtherObj = otherObj as CircleColliderResult;
            const minDist = thisObj.radius + cOtherObj.radius + Number.EPSILON;

            // As a last check, we need to make sure that despite all this, the two objects
            // are not on top of each other.
            if (vec2.sqrDist(this.position, cOtherObj.position) <= minDist * minDist) {
                const temp = vec2.create();
                vec2.sub(temp, this.position, cOtherObj.position);
                const amt = minDist - vec2.length(temp);
                vec2.normalize(temp, temp);

                vec2.scale(temp, temp, amt);
                vec2.add(this.position, this.position, temp);
            }
        }
    }

    draw(camera: DefaultCamera, time: RefreshTime) {
        super.draw(camera, time);
    }
}
