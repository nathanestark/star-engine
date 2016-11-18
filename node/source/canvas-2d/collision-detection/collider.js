import {vec2} from 'gl-matrix';
import Math2D from '../math-2d';

export default class Collider {
    constructor(properties = {}) {
        this.classTags = ["collider"];

        // If no parent was provided, then we are considered 'static'.
        if(properties.parent)
            this.parent = properties.parent;
        else
            this.parent = null;

        if(properties.name)
            this.name = properties.name;

        this.color = "red";
        if(properties.color)
            this.color = properties.color;

        if(properties.position) {
            this.position = properties.position;
        } else {
            this.position = vec2.create();
        }

        this.velocity = vec2.create();
    }

    get static() {
        return this.parent == null;
    }

    update(tDelta) { 
        if(!this.static) {
            this.position = this.parent.position;
            this.velocity = this.parent.velocity;
        }
    }

    debugDraw(tDelta, camera, context){
        context.fillStyle = this.color;
        context.beginPath();
        
        let p1 = this.position[0];
        let p2 = this.position[1];

        context.arc(p1, p2, 0.5 / camera.zoom[0], 0, Math2D.twoPi);
        context.fill();
    }

    testInsideBoundingBox(bounds) {
        // Return 0 for outside, 1 for cross-border, and 2 for fully inside.
        return 0;
    }

    testCollision(collider, tDelta) {
        let test = this["test" + collider.constructor.name + "Collision"].bind(this);        
        if(test)
            return test(collider);
        else {
             test = collider["test" + this.constructor.name + "Collision"].bind(this);        
             if(test)
                return test(this);
        }

        // No collider functions match.
        return null;
    }

    onCollisions(collisions) {
        // If we're not static, let the parent know about the collisions.
        if(!this.static) {
            if(this.parent.onCollisions)
                this.parent.onCollisions(collisions);

            for(let i = 0; i < collisions.length; i++) {
                if(this.parent.onCollision)
                    this.parent.onCollision(collisions[i].obj1, collisions[i].obj2);
            }
        }
    }

    onCollided(collisions) {
        // If we're not static, let the parent know about the collisions.
        if(!this.static) {
            for(let i = 0; i < collisions.length; i++) {
                if(this.parent.onCollided)
                    this.parent.onCollided(collisions[i].obj1, collisions[i].obj2);
            }
        }
    }
}