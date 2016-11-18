import {vec2} from 'gl-matrix';
import Math2D from '../math-2d';
import ColliderOperations from './collider-operations';
import Collider from './collider';

export default class BoundingBoxCollider extends Collider {
    constructor(properties = {}) {
        super(properties);

        this.bounds = null;
        if(properties.bounds)
            this.bounds = properties.bounds;
        else
            this.bounds = [vec2.create(), vec2.create()];
    }

    update(tDelta) {
        super.update(tDelta);

        if(!this.static) {
            this.bounds = this.parent.bounds;
        }
    }

    debugDraw(tDelta, camera, context){
        // Don't draw super; replace it with our own drawing.

        context.strokeStyle = this.color;
        context.lineWidth = 0.5 / camera.zoom[0];
        context.strokeRect(this.bounds[0][0], 
                           this.bounds[0][1], 
                           this.bounds[1][0] - this.bounds[0][0], 
                           this.bounds[1][1] - this.bounds[0][1]);
    }

    testInsideBoundingBox(bounds) {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return Math2D.boundingBoxOnBoundingBox(this.bounds, bounds);
    }

    testCircleColliderCollision(collider, tDelta) {
        return ColliderOperations.testCircleOnBoundingBoxCollisions(collider, this);
    }

    // Not entirely sure this one makes sense...
    testBoundingBoxColliderCollision(collider, tDelta) {
        return ColliderOperations.testBoundingBoxOnBoundingBoxCollisions(this, collider);
    }

}