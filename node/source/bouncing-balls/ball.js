import {vec2} from 'gl-matrix';
import CircleCollider from '../canvas-2d/collision-detection/circle-collider';
import Math2D from '../canvas-2d/math-2d';

export default class Ball {
    constructor(game, properties = {}) {
        this.classTags = ["ball"];
this.game =game;
        this.color = "#000";
        this.radius = 1;
        this.mass = 1;
        this.elasticity = 1;
        this.position = vec2.create();
        this.velocity = vec2.create();
        this.totalForce = vec2.create();
        this.surface = null;
        this.selected = false;
        this.surfaceGrabSpeed = 0;
        this.minSpeed = 0.001;

        if (properties.position
            && properties.position instanceof Float32Array) {
            this.position = properties.position;
        }
        if (properties.velocity
            && properties.velocity instanceof Float32Array) {
            this.velocity = properties.velocity;
        }
        if (typeof (properties.radius) == 'number') {
            this.radius = properties.radius;
        }
        if (typeof (properties.mass) == 'number') {
            this.mass = properties.mass;
        }
        if (typeof (properties.elasticity) == 'number') {
            this.elasticity = properties.elasticity;
        }
        if (properties.color)
            this.color = properties.color;

        if(properties.onCollision)
            this._onCollision = properties.onCollision;

        // Add a collider as a child.
        this.children = [
            new CircleCollider({parent: this})
        ];
    }

    update(tDelta) {
       
        // Apply our total force to our velocity.
        vec2.scale(this.totalForce, this.totalForce, tDelta / (this.mass));
        vec2.add(this.velocity, this.velocity, this.totalForce);

        // Check for surface normal force negation.
        if(this.surfaceGrabSpeed > 0 && this.surface != null) {
            let temp = null;
            if(this.surface.normal)
                temp = vec2.clone(this.surface.normal);
            else {

                temp = vec2.create();
                vec2.sub(temp, this.surface.position, this.position); 
                vec2.normalize(temp, temp);                
            }
            const dot = vec2.dot(this.velocity, temp);
            vec2.scale(temp, temp, dot);
            const len = vec2.sqrLen(temp);
            if(len < this.surfaceGrabSpeed*2) {
                vec2.sub(this.velocity, this.velocity, temp);
            } else {
                if(this.surface != null)
                    this.onDetachSurface();
            }
        }

        let sqrSpeed = vec2.sqrLen(this.velocity);
        // Check if our velocity falls below epsilon.
        if(sqrSpeed <= this.minSpeed * this.minSpeed)  {
            vec2.set(this.velocity, 0, 0);
            sqrSpeed = 0;
        }

        // Apply our velocity to our position, but don't destroy velocity.
        if(sqrSpeed > 0) {
            const vel = vec2.clone(this.velocity);
            vec2.scale(vel, vel, tDelta);
            vec2.add(this.position, this.position, vel);
        }
        // Reset force.
        this.totalForce = vec2.create();
    }

    onCollision(thisObj, otherObj) {
        if(this.removed) return;
        //collider: collider1,
        //parent: collider1.parent,
        //position: pos1, 
        //normal: norm1,
        //velocity: vec2.clone(collider1.velocity), 
        //timeLeft: t,
        //radius: collider1.radius,

        const normal = thisObj.normal;

        // On collision, we want the ball to bounce.
        const temp = vec2.create();

        // Calculate new velocity for after the collision, and update our velocity.
        if(otherObj.parent instanceof Ball) {
            
/*            Math2D.calculateElasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    this.elasticity * otherObj.parent.elasticity,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass,
                                                    otherObj.velocity,
                                                    otherObj.parent.mass);
            */                                        
            Math2D.calculateInelasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass,
                                                    otherObj.velocity,
                                                    otherObj.parent.mass); 
                                                    
            otherObj.parent.removed = true;
            this.game.removeGameObject(otherObj.parent.id);
                                                    
        } else {
            Math2D.calculateElasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    this.elasticity,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass);
        }

        // If this new velocity is less than our minSpeed in the direction of the surface normal,
        // then remove any speed component towards the surface normal.
        if(this.surfaceGrabSpeed > 0) {
            let dot = vec2.dot(this.velocity, normal);
            vec2.scale(temp, normal, dot);
            const len = vec2.sqrLen(this.velocity);
            if(len < this.surfaceGrabSpeed) {

                dot = vec2.dot(this.totalForce, normal);    
                vec2.scale(temp, normal, dot);
                vec2.sub(this.totalForce, this.totalForce, temp);

                if(this.surface != otherObj.parent) {
                    if(this.surface != null)
                        this.onDetachSurface();

                    if(otherObj.parent != null) {
                        // Attach directly to the object, or if it is a plane, to the plane.
                        let surf = otherObj.parent;
                        if(otherObj.collider instanceof(BoundingBoxCollider)) {
                            surf = otherObj.plane;
                        }

                        this.onAttachSurface(surf);
                    }
                }

            } else if((this.surface == otherObj.parent 
                        || (otherObj.collider instanceof(BoundingBoxCollider) 
                            && this.surface == otherObj.plane))
                    && len < this.surfaceGrabSpeed*2) {

                dot = vec2.dot(this.totalForce, normal);    
                vec2.scale(temp, normal, dot);
                vec2.sub(this.totalForce, this.totalForce, temp);

            } else {
                if(this.surface != null)
                    this.onDetachSurface();
            }
        }

        // Finally calculate new position based off of collision position,
        // new velocity and negated timeLeft.
        vec2.scale(temp, this.velocity, thisObj.timeLeft);
        vec2.add(this.position, thisObj.position, temp);
    }

    onCollided(thisObj, otherObj) {
        if(otherObj.parent instanceof Ball) {
            const minDist = thisObj.radius + otherObj.radius + Number.EPSILON;

            // As a last check, we need to make sure that despite all this, the two objects
            // are not on top of each other.
            if(vec2.sqrDist(this.position, otherObj.position) <= minDist*minDist) {
                const temp = vec2.create();
                vec2.sub(temp, this.position, otherObj.position);
                const amt = minDist - vec2.length(temp);
                vec2.normalize(temp, temp);
                
                vec2.scale(temp, temp, amt);
                vec2.add(this.position, this.position, temp);
            }
        }

        if(this._onCollision)
            this._onCollision(thisObj, otherObj);
    }

    onAttachSurface(obj) {
        console.log("Attach");
        this.surface = obj;
    }

    onDetachSurface(obj) {
        console.log("Detach");
        this.surface = null;
    }

    draw(tDelta, camera, context){
        context.fillStyle = this.color;
        context.beginPath();
        
        context.arc(this.position[0], this.position[1], this.radius, 0, Math2D.twoPi);
        context.fill();
    }
}