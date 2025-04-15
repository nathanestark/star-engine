import * as Math2D from "../math-2d";
import Collider, { ColliderProperties, Collidable } from "./collider";
import Canvas2DCamera from "../cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";
import { vec2 } from "gl-matrix";
import BoundingBoxCollider from "./bounding-box-collider";
import {
    CollisionResult,
    testCircleOnCircleCollisons,
    testCircleOnBoundingBoxCollisions
} from "./collider-operations";

export interface CircleCollidable extends Collidable {
    radius: number;
}

export interface CircleColliderProperties extends ColliderProperties {
    radius?: number;
}

export default class CircleCollider extends Collider<CircleCollidable> {
    radius: number;

    constructor(owner: CircleCollidable, { radius, ...superProps }: CircleColliderProperties = {}) {
        super(owner, superProps);

        this.owner = owner;

        this.radius = 0;
        if (radius) this.radius = radius;

        this.colliderTestMap = {
            ["CircleCollider"]: this.testCircleColliderCollision,
            ["BoundingBoxCollider"]: this.testBoundingBoxColliderCollision
        };
    }

    update(tDelta: number) {
        super.update(tDelta);

        if (!this.static) {
            this.radius = this.owner.radius;
        }
    }
    debugDraw(camera: Canvas2DCamera, _time: RefreshTime) {
        // Don't draw super; replace it with our own drawing.

        camera.context.strokeStyle = this.color;
        camera.context.lineWidth = 0.5 / camera.zoom[0];
        camera.context.beginPath();

        camera.context.arc(0, 0, this.radius, 0, Math2D.twoPi);
        camera.context.stroke();
    }

    testInsideBoundingBox(bounds: [vec2, vec2]): 0 | 1 | 2 {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return Math2D.circleOnBoundingBox(this.position, this.radius, bounds);
    }

    testCircleColliderCollision(collider: CircleCollider): null | Array<CollisionResult> {
        return testCircleOnCircleCollisons(this, collider);
    }

    testBoundingBoxColliderCollision(collider: BoundingBoxCollider): null | Array<CollisionResult> {
        return testCircleOnBoundingBoxCollisions(this, collider);
    }
}
