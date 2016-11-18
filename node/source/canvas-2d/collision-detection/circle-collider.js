import {vec2} from 'gl-matrix';
import Math2D from '../math-2d';
import ColliderOperations from './collider-operations';
import Collider from './collider';

export default class CircleCollider extends Collider {
    constructor(properties = {}) {
        super(properties);

        this.radius = 0;
        if(properties.radius)
            this.radius = properties.radius;
    }

    update(tDelta) {
        super.update(tDelta);

        if(!this.static) {
            this.radius = this.parent.radius;
        }
    }

    debugDraw(tDelta, camera, context){
        // Don't draw super; replace it with our own drawing.
        
        context.strokeStyle = this.color;
        context.lineWidth = 0.5 / camera.zoom[0];
        context.beginPath();
        
        context.arc(this.position[0], this.position[1], this.radius, 0, Math2D.twoPi);
        context.stroke();
    }

    testInsideBoundingBox(bounds) {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return Math2D.circleOnBoundingBox(this.position, this.radius, bounds);
    }

    testCircleColliderCollision(collider, tDelta) {
        return ColliderOperations.testCircleOnCircleCollisons(this, collider);
    }

    testBoundingBoxColliderCollision(collider, tDelta) {
        return ColliderOperations.testCircleOnBoundingBoxCollisions(this, collider);
    }


}