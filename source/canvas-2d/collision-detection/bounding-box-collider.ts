import { vec2 } from "gl-matrix";
import * as Math2D from "../math-2d";
import Collider, { ColliderProperties, Collidable } from "./collider";
import Canvas2DCamera from "../cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";
import CircleCollider from "./circle-collider";
import {
    CollisionResult,
    testCircleOnBoundingBoxCollisions,
    testBoundingBoxOnBoundingBoxCollisions
} from "./collider-operations";

export interface BoundingBoxCollidable extends Collidable {
    bounds: [vec2, vec2];
}

export interface BoundingBoxColliderProperties extends ColliderProperties {
    bounds?: [vec2, vec2];
}

export default class BoundingBoxCollider extends Collider<BoundingBoxCollidable> {
    bounds: [vec2, vec2];
    constructor(
        owner: BoundingBoxCollidable,
        { bounds, ...superProps }: BoundingBoxColliderProperties = {}
    ) {
        super(owner, superProps);

        if (bounds) this.bounds = bounds;
        else this.bounds = [vec2.create(), vec2.create()];

        this.colliderTestMap = {
            ["CircleCollider"]: this.testCircleColliderCollision,
            ["BoundingBoxCollider"]: this.testBoundingBoxColliderCollision
        };
    }

    update(tDelta: number) {
        super.update(tDelta);

        if (!this.static) {
            this.bounds = this.owner.bounds;
        }
    }

    debugDraw(camera: Canvas2DCamera, _time: RefreshTime) {
        // Don't draw super; replace it with our own drawing.

        camera.context.strokeStyle = this.color;
        camera.context.lineWidth = 0.5 / camera.zoom[0];
        camera.context.strokeRect(
            this.bounds[0][0],
            this.bounds[0][1],
            this.bounds[1][0] - this.bounds[0][0],
            this.bounds[1][1] - this.bounds[0][1]
        );
    }

    testInsideBoundingBox(bounds: [vec2, vec2]): 0 | 1 | 2 {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return Math2D.boundingBoxOnBoundingBox(this.bounds, bounds);
    }

    testCircleColliderCollision(collider: CircleCollider): null | Array<CollisionResult> {
        return testCircleOnBoundingBoxCollisions(collider, this);
    }

    // Not entirely sure this one makes sense...
    testBoundingBoxColliderCollision(collider: BoundingBoxCollider): null | Array<CollisionResult> {
        return testBoundingBoxOnBoundingBoxCollisions(this, collider);
    }
}
