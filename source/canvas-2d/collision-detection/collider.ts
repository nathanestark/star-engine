import { vec2 } from "gl-matrix";
import * as Math2D from "../math-2d";
import { GameObject2D } from "../types";
import GameObject from "source/core/game-object";
import Canvas2DCamera from "../cameras/canvas-2d-camera";
import { CollisionResult, ColliderResult } from "./collider-operations";
import { RefreshTime } from "source/core/types";

export interface ColliderProperties {
    name?: string;
    color?: string;
    position?: vec2;
}

export interface Collidable extends GameObject2D {
    _collider: ICollider;
    onCollision?: (obj1: ColliderResult, obj2: ColliderResult) => void;
    onCollided?: (obj1: ColliderResult, obj2: ColliderResult) => void;
}

export interface ICollider {
    colliderTestMap: Record<string, (collider: ICollider) => Array<CollisionResult>>;
    testInsideBoundingBox(_bounds: [vec2, vec2]): 0 | 1 | 2;
    testCollision(collider: ICollider, _tDelta: number): null | Array<CollisionResult>;
    onCollision: (collisions: Array<CollisionResult>) => void;
    onCollided: (collisions: Array<CollisionResult>) => void;
}

export default class Collider<T_owner extends Collidable>
    extends GameObject
    implements ICollider, GameObject2D
{
    owner: T_owner;
    name: string;
    color: string;
    position: vec2;
    velocity: vec2;
    totalForce: vec2;

    colliderTestMap: Record<string, (collider: ICollider) => Array<CollisionResult>> = {};

    constructor(owner: T_owner, { name, color, position }: ColliderProperties = {}) {
        super();

        this.owner = owner;

        this.classTags = ["collider"];

        if (name) this.name = name;

        this.color = "red";
        if (color) this.color = color;

        if (position) {
            this.position = position;
        } else {
            this.position = vec2.create();
        }

        this.velocity = vec2.create();
    }

    get static() {
        // If we're not active yet, then we don't know if we're static.
        if (!this.active) return false;

        // Should come up with a decent way of determining if we're static or not.
        return false;
    }

    update(_tDelta: number) {
        if (!this.static) {
            this.position = this.owner.position;
            this.velocity = this.owner.velocity;
            this.totalForce = this.owner.totalForce;
        }
    }

    debugDraw(camera: Canvas2DCamera, _time: RefreshTime) {
        camera.context.fillStyle = this.color;
        camera.context.beginPath();

        camera.context.arc(0, 0, 0.5 / camera.zoom[0], 0, Math2D.twoPi);
        camera.context.fill();
    }

    testInsideBoundingBox(_bounds: [vec2, vec2]): 0 | 1 | 2 {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return 0;
    }

    testCollision(collider: Collider<T_owner>, _tDelta: number): null | Array<CollisionResult> {
        let test = this.colliderTestMap[collider.constructor.name];
        if (test) return test.bind(this)(collider);
        else {
            let test = collider.colliderTestMap[this.constructor.name];
            if (test) return test.bind(collider)(test);
        }

        // No collider functions match.
        return null;
    }

    onCollision(collisions: Array<CollisionResult>) {
        // If we're not static, let the owner know about the collisions.
        if (!this.static) {
            for (let i = 0; i < collisions.length; i++) {
                if (this.owner.onCollision)
                    this.owner.onCollision(collisions[i].obj1, collisions[i].obj2);
            }
        }
    }

    onCollided(collisions: Array<CollisionResult>) {
        // If we're not static, let the owner know about the collisions.
        if (!this.static) {
            for (let i = 0; i < collisions.length; i++) {
                if (this.owner.onCollided && !collisions[i].obj1.canceled)
                    this.owner.onCollided(collisions[i].obj1, collisions[i].obj2);
            }
        }
    }
}
