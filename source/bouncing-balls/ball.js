import { vec2 } from "gl-matrix";
import CircleCollider from "../canvas-2d/collision-detection/circle-collider";
import BoundingBoxCollider from "../canvas-2d/collision-detection/bounding-box-collider";
import Math2D from "../canvas-2d/math-2d";

export default class Ball {
    constructor(game, properties = {}) {
        this.classTags = ["ball"];
        this.game = game;
        this.color = "#000";
        this.radius = 1;
        this.mass = 1;
        this.elasticity = 1;
        this.position = vec2.create();
        this.velocity = vec2.create();
        this.totalForce = vec2.create();
        this.surfaces = [];
        this.selected = false;
        this.surfaceGrabSpeed = 2.5;
        this.surfaceGrabSpeedSqr = Math.pow(this.surfaceGrabSpeed, 2);
        this.minSpeed = 0.1;
        this.rollDrag = 0;

        if (properties.position && properties.position instanceof Float32Array) {
            this.position = properties.position;
        }
        if (properties.velocity && properties.velocity instanceof Float32Array) {
            this.velocity = properties.velocity;
        }
        if (typeof properties.radius == "number") {
            this.radius = properties.radius;
        }
        if (typeof properties.mass == "number") {
            this.mass = properties.mass;
        }
        if (typeof properties.elasticity == "number") {
            this.elasticity = properties.elasticity;
        }
        if (typeof properties.rollDrag == "number") {
            this.rollDrag = properties.rollDrag;
        }
        if (properties.color) this.color = properties.color;

        if (properties.onCollision) this._onCollision = properties.onCollision;

        // Add a collider as a child.
        this.children = [new CircleCollider({ parent: this })];
    }

    print(fn) {
        if (this.color == "white" && this.surfaces.length) {
            fn();
        }
    }

    update(tDelta) {
        // Apply our total force to our velocity.
        vec2.scale(this.totalForce, this.totalForce, tDelta / this.mass);
        vec2.add(this.velocity, this.velocity, this.totalForce);
        // Check for surface normal force negation.
        this.surfaces.forEach((surface) => {
            let surfaceNormal = vec2.create();
            if (surface.normal) {
                surfaceNormal = vec2.clone(surface.normal);
            } else {
                vec2.normalize(
                    surfaceNormal,
                    vec2.sub(surfaceNormal, surface.position, this.position)
                );
            }

            // If our velocity is less than our surfaceGrabSpeed opposite the direction of the surface normal,
            // then remove any speed component towards the surface normal.
            // But we have to have a force acting on us as well.
            if (vec2.dot(this.totalForce, surfaceNormal) < 0) {
                // Get the relative velocity between the two objects.
                let relativeVel = this.velocity;
                if (!surface.isBoundingBoxPlane) {
                    relativeVel = vec2.sub(vec2.create(), this.velocity, surface.velocity);
                }

                // Normalize our totalForce, and find out our speed in the
                // direction of that normal, to determine if we're below the
                // surfaceGrabSpeed
                // AND our velocity is negative or 0 in the direction of
                // the surface normal
                const normalForce = vec2.normalize(vec2.create(), this.totalForce);
                const forceDirectionVelocity = vec2.scale(
                    vec2.create(),
                    normalForce,
                    vec2.dot(normalForce, relativeVel)
                );
                // console.log(fv(normalForce), fv(relativeVel), fv(forceDirectionVelocity), tDelta)
                const len = vec2.sqrLen(forceDirectionVelocity);

                // console.log("Test", len, "<", this.surfaceGrabSpeedSqr, "&&", vec2.dot(relativeVel, surfaceNormal), "<=", 0)
                if (len < this.surfaceGrabSpeedSqr && vec2.dot(relativeVel, surfaceNormal) <= 0) {
                    let temp = vec2.create();

                    // If we've attached, attenuate our velocity vs our surface normal.
                    vec2.scale(temp, surfaceNormal, vec2.dot(surfaceNormal, this.velocity));
                    vec2.sub(this.velocity, this.velocity, temp);

                    // Calculating our drag force must be done after we know our
                    // velocity, since it has to run counter to that velocity.
                    // We can apply it to the entire remaining velocity here, since
                    // we've already negated the surface normal counter force.
                    const dragMagnitude = vec2.len(this.velocity) * this.rollDrag * tDelta;
                    const dragForce = vec2.normalize(vec2.create(), this.velocity);
                    vec2.scale(dragForce, dragForce, dragMagnitude);
                    vec2.sub(this.velocity, this.velocity, dragForce);

                    // Apply our 'lost' force in the direction of the normal to
                    // the other surface, if not a bounding box
                    if (!surface.isBoundingBoxPlane) {
                        const toAdd = vec2.scale(
                            vec2.create(),
                            surfaceNormal,
                            vec2.dot(this.totalForce, surfaceNormal)
                        );
                        vec2.add(surface.totalForce, surface.totalForce, toAdd);
                    }
                } else {
                    // Otherwise, we must detach
                    // console.log("Test", len, "<", this.surfaceGrabSpeedSqr, "&&", vec2.dot(relativeVel, surfaceNormal), "<=", 0)
                    // this.onDetachSurface(surface)
                }
            } else {
                // Otherwise, we must detach
                // console.log("Test", vec2.dot(this.totalForce, surfaceNormal), "<", 0);
                // this.onDetachSurface(surface)
            }
        });

        let sqrSpeed = vec2.sqrLen(this.velocity);
        // Check if our velocity falls below epsilon.
        if (this.surfaces.length && sqrSpeed <= Math.pow(this.minSpeed, 2)) {
            vec2.set(this.velocity, 0, 0);
            sqrSpeed = 0;
        }

        // Apply our velocity to our position, but don't destroy velocity.
        if (sqrSpeed > 0) {
            // if (this.color == "white")
            //     console.log("Update", fv(this.velocity), fv(this.position))
            const vel = vec2.clone(this.velocity);
            vec2.scale(vel, vel, tDelta);
            vec2.add(this.position, this.position, vel);
            if (Number.isNaN(this.position[0])) {
                throw "Bad position";
            }
        }
        // Reset force.
        this.totalForce = vec2.create();
    }

    onCollision(thisObj, otherObj) {
        if (this.removed) return;

        //collider: collider1,
        //parent: collider1.parent,
        //position: pos1,
        //normal: norm1,
        //velocity: vec2.clone(collider1.velocity),
        //timeLeft: t,
        //radius: collider1.radius,

        const isOtherObjBoundingBox = otherObj.collider instanceof BoundingBoxCollider;
        const normal = thisObj.normal;

        // On collision, we want the ball to bounce, if it is going fast enough
        const temp = vec2.create();

        // Did we attach to this other object this round?
        let attached = false;
        let alreadyAttached = false;

        // If our velocity is less than our surfaceGrabSpeed opposite the direction of the surface normal,
        // then remove any velocity component towards the surface normal.
        // But we have to have a force acting on us as well.
        if (this.surfaceGrabSpeed > 0 && vec2.dot(this.totalForce, normal) < 0) {
            // Get the relative velocity between the two objects.
            let relativeVel = this.velocity;
            if (!isOtherObjBoundingBox) {
                relativeVel = vec2.sub(vec2.create(), otherObj.velocity, thisObj.velocity);
            }

            // Normalize our totalForce, and find out our speed in the
            // direction of that normal, to determine if we're below the
            // surfaceGrabSpeed
            // AND our velocity is negative or 0 in the direction of
            // the surface normal
            const normalForce = vec2.normalize(vec2.create(), this.totalForce);
            const forceDirectionVelocity = vec2.scale(
                temp,
                normalForce,
                vec2.dot(normalForce, relativeVel)
            );
            const len = vec2.sqrLen(forceDirectionVelocity);

            // console.log(len < this.surfaceGrabSpeedSqr, "=", len, "<", this.surfaceGrabSpeedSqr)
            if (len < this.surfaceGrabSpeedSqr && vec2.dot(relativeVel, normal) <= 0) {
                // Then we don't want to bounce.

                // Determine the new surface
                if (otherObj.parent != null) {
                    // Attach directly to the object, or if it is a plane, to the plane.
                    let surf = otherObj.parent;
                    if (isOtherObjBoundingBox) {
                        surf = {
                            isBoundingBoxPlane: true,
                            parent: otherObj.parent,
                            plane: otherObj.plane,
                            normal: normal
                        };
                    }
                    // If we're not already attached to this surface, attach.
                    const inSurfaces = this.surfaces.some((surface) => {
                        if (!surface.isBoundingBoxPlane) {
                            return surface == surf;
                        }
                        if (!surf.isBoundingBoxPlane) return false;
                        if (surface.parent != surf.parent) return false;
                        if (surface.plane[0] != surf.plane[0] || surface.plane[1] != surf.plane[1])
                            return false;

                        return true;
                    });
                    if (!inSurfaces) {
                        attached = true;
                        this.onAttachSurface(surf);
                    } else {
                        alreadyAttached = true;
                    }
                }
            }
        }

        // Calculate new velocity for after the collision, and update our velocity.
        if (attached) {
            // If we've attached, attenuate our velocity vs our surface normal.
            vec2.scale(temp, normal, vec2.dot(normal, thisObj.velocity));
            vec2.sub(this.velocity, thisObj.velocity, temp);
        } else if (alreadyAttached) {
            // Do nothing?
        } else if (otherObj.parent instanceof Ball) {
            Math2D.calculateElasticCollisionVelocity(
                this.velocity,
                this.velocity,
                normal,
                this.elasticity * otherObj.parent.elasticity,
                thisObj.velocity,
                thisObj.parent.mass,
                otherObj.velocity,
                otherObj.parent.mass
            );
            /*            Math2D.calculateInelasticCollisionVelocity(this.velocity, 
                                                    this.velocity,
                                                    normal,
                                                    thisObj.velocity,
                                                    thisObj.parent.mass,
                                                    otherObj.velocity,
                                                    otherObj.parent.mass); 
                                                    
            otherObj.parent.removed = true;
            this.game.removeGameObject(otherObj.parent.id);
*/
        } else {
            Math2D.calculateElasticCollisionVelocity(
                this.velocity,
                this.velocity,
                normal,
                this.elasticity,
                thisObj.velocity,
                thisObj.parent.mass
            );
        }

        // Finally calculate new position based off of collision position,
        // new velocity and negated timeLeft.
        vec2.scale(temp, this.velocity, thisObj.timeLeft);
        vec2.add(this.position, thisObj.position, temp);
        if (Number.isNaN(this.position[0])) {
            throw "Bad position";
        }
    }

    onCollided(thisObj, otherObj) {
        if (otherObj.parent instanceof Ball) {
            //     const minDist = thisObj.radius + otherObj.radius + Number.EPSILON;
            //     // As a last check, we need to make sure that despite all this, the two objects
            //     // are not on top of each other.
            //     if(vec2.sqrDist(this.position, otherObj.position) <= minDist*minDist) {
            //         const temp = vec2.create();
            //         vec2.sub(temp, this.position, otherObj.position);
            //         const amt = minDist - vec2.length(temp);
            //         vec2.normalize(temp, temp);
            //         vec2.scale(temp, temp, amt);
            //         vec2.add(this.position, this.position, temp);
            //     }
        }

        if (this._onCollision) this._onCollision(thisObj, otherObj);
    }

    onAttachSurface(obj) {
        console.log("Attach!", this, obj);
        this.surfaces.push(obj);
    }

    onDetachSurface(obj) {
        console.log("Detach");
        const index = this.surfaces.findIndex((surface) => {
            if (!surface.isBoundingBoxPlane) {
                return surface == obj;
            }
            if (!obj.isBoundingBoxPlane) return false;
            if (surface.parent != obj.parent) return false;
            if (surface.plane[0] != obj.plane[0] || surface.plane[1] != obj.plane[1]) return false;

            return true;
        });

        if (index != -1) this.surfaces.splice(index, 1);
    }

    draw(time, camera, context) {
        context.fillStyle = this.color;
        context.beginPath();

        context.arc(this.position[0], this.position[1], this.radius, 0, Math2D.twoPi);
        context.fill();
    }
}
