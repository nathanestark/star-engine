import {vec2} from 'gl-matrix';
import CircleCollider from '../canvas-2d/collision-detection/circle-collider';
import DrawBaseObject from './draw-base-object';
import Math2D from '../canvas-2d/math-2d';

export default class GameBaseObject extends DrawBaseObject {
    constructor(game, properties = {}) {
        super(game, properties =Object.assign({
            mass: 1,
            radius: 1,
            elasticity: 1,
            position: vec2.create(),
            velocity: vec2.create(),
            rotation: 0,
        }, properties));
        this.classTags = ["gamebase"];
        this.game = game;
        this.totalForce = vec2.create();

        if (properties.velocity
            && properties.velocity instanceof Float32Array) {
            this.velocity = properties.velocity;
        }
        if (typeof (properties.mass) == 'number') {
            this.mass = properties.mass;
        }
        if (typeof (properties.elasticity) == 'number') {
            this.elasticity = properties.elasticity;
        }

        if(properties.onCollision)
            this._onCollision = properties.onCollision;

        // Add a collider as a child.
        this.children = [
            new CircleCollider({parent: this, position: this.position, radius: this.radius })
        ];
    }

    update(tDelta) {
       
        // Apply our total force to our velocity.
        vec2.scale(this.totalForce, this.totalForce, tDelta / (this.mass));
        vec2.add(this.velocity, this.velocity, this.totalForce);

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

        // On collision, we want the asteroid to bounce.
        const temp = vec2.create();

        if(otherObj && otherObj.velocity) {
            // Calculate new velocity for after the collision, and update our velocity.
            Math2D.calculateElasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    this.elasticity * otherObj.parent.elasticity,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass,
                                                    otherObj.velocity,
                                                    otherObj.parent.mass);
                                        
        } else {
            Math2D.calculateElasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    this.elasticity,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass);
        }

        // Finally calculate new position based off of collision position,
        // new velocity and negated timeLeft.
        vec2.scale(temp, this.velocity, thisObj.timeLeft);
        vec2.add(this.position, thisObj.position, temp);
    }

    onCollided(thisObj, otherObj) {
        if(this.removed || otherObj.parent.removed) return;

        if(otherObj.parent instanceof GameBaseObject) {
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

    draw(time, camera, context){
        super.draw(time, camera, context);
    }
}