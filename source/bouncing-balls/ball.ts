import { vec2 } from "gl-matrix";
import CircleCollider from "../canvas-2d/collision-detection/circle-collider";
import BoundingBoxCollider from "../canvas-2d/collision-detection/bounding-box-collider";
import * as Math2D from "../canvas-2d/math-2d";
import { GameObject2D } from "source/canvas-2d/types";
import GameObject from "source/core/game-object";
import { Collidable } from "source/canvas-2d/collision-detection/collider";
import {
    BoundingBoxColliderResult,
    CircleColliderResult,
    ColliderResult
} from "source/canvas-2d/collision-detection/collider-operations";
import DefaultCamera from "./default-camera";
import { RefreshTime } from "source/core/types";

interface Surface {
    isBoundingBoxPlane: boolean;
    parent: GameObject2D;
    plane: vec2;
    normal: vec2;
}

export interface BallProperties {
    position?: vec2;
    velocity?: vec2;
    radius?: number;
    mass?: number;
    elasticity?: number;
    rollDrag?: number;
    color?: string;
}

export default class Ball extends GameObject implements GameObject2D, Collidable {
    position: vec2;
    velocity: vec2;
    totalForce: vec2;
    radius: number;
    mass: number;
    elasticity: number;
    rollDrag: number;
    color: string;

    surfaces: Array<Surface | GameObject2D>;
    selected: boolean;
    surfaceGrabSpeed: number;
    surfaceGrabSpeedSqr: number;
    minSpeed: number;

    _collider: CircleCollider;
    constructor({
        position,
        velocity,
        radius,
        mass,
        elasticity,
        rollDrag,
        color
    }: BallProperties = {}) {
        super();

        this.classTags = ["ball"];
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

        if (position) {
            this.position = position;
        }
        if (velocity) {
            this.velocity = velocity;
        }
        if (typeof radius == "number") {
            this.radius = radius;
        }
        if (typeof mass == "number") {
            this.mass = mass;
        }
        if (typeof elasticity == "number") {
            this.elasticity = elasticity;
        }
        if (typeof rollDrag == "number") {
            this.rollDrag = rollDrag;
        }
        if (color) this.color = color;

        // Add a collider as a child.
        this._collider = new CircleCollider(this);
        this.children = [this._collider];
    }

    update(time: RefreshTime) {
        // Apply our total force to our velocity.
        vec2.scale(this.totalForce, this.totalForce, time.timeAdvance / this.mass);
        vec2.add(this.velocity, this.velocity, this.totalForce);
        // Check for surface normal force negation.
        this.surfaces.forEach((surface) => {
            const sSurface = surface as Surface;
            const gSurface = surface as GameObject2D;
            let surfaceNormal = vec2.create();
            if (sSurface.isBoundingBoxPlane) {
                surfaceNormal = vec2.clone(sSurface.normal);
            } else {
                vec2.normalize(
                    surfaceNormal,
                    vec2.sub(surfaceNormal, gSurface.position, this.position)
                );
            }

            // If our velocity is less than our surfaceGrabSpeed opposite the direction of the surface normal,
            // then remove any speed component towards the surface normal.
            // But we have to have a force acting on us as well.
            if (vec2.dot(this.totalForce, surfaceNormal) < 0) {
                // Get the relative velocity between the two objects.
                let relativeVel = this.velocity;
                if (!sSurface.isBoundingBoxPlane) {
                    relativeVel = vec2.sub(vec2.create(), this.velocity, gSurface.velocity);
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
                    const dragMagnitude =
                        vec2.len(this.velocity) * this.rollDrag * time.timeAdvance;
                    const dragForce = vec2.normalize(vec2.create(), this.velocity);
                    vec2.scale(dragForce, dragForce, dragMagnitude);
                    vec2.sub(this.velocity, this.velocity, dragForce);

                    // Apply our 'lost' force in the direction of the normal to
                    // the other surface, if not a bounding box
                    if (!sSurface.isBoundingBoxPlane) {
                        const toAdd = vec2.scale(
                            vec2.create(),
                            surfaceNormal,
                            vec2.dot(this.totalForce, surfaceNormal)
                        );
                        vec2.add(gSurface.totalForce, gSurface.totalForce, toAdd);
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
            vec2.scale(vel, vel, time.timeAdvance);
            vec2.add(this.position, this.position, vel);
            if (Number.isNaN(this.position[0])) {
                throw "Bad position";
            }
        }
        // Reset force.
        this.totalForce = vec2.create();
    }

    onCollision(thisObj: CircleColliderResult, otherObj: ColliderResult) {
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
                const bOtherObj = otherObj as CircleColliderResult;
                relativeVel = vec2.sub(vec2.create(), bOtherObj.velocity, thisObj.velocity);
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
                if (otherObj.owner != null) {
                    // Attach directly to the object, or if it is a plane, to the plane.
                    let surf: GameObject2D | Surface = otherObj.owner;
                    if (isOtherObjBoundingBox) {
                        surf = {
                            isBoundingBoxPlane: true,
                            parent: otherObj.owner,
                            plane: (otherObj as BoundingBoxColliderResult).plane,
                            normal: normal
                        };
                    }

                    const sSurf = surf as Surface;
                    // If we're not already attached to this surface, attach.
                    const inSurfaces = this.surfaces.some((surface) => {
                        const sSurface = surface as Surface;
                        if (!sSurface.isBoundingBoxPlane) {
                            return surface == surf;
                        }
                        if (!sSurf.isBoundingBoxPlane) return false;
                        if (surface.parent != surf.parent) return false;
                        if (
                            sSurface.plane[0] != sSurf.plane[0] ||
                            sSurface.plane[1] != sSurf.plane[1]
                        )
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
        } else if (otherObj.owner instanceof Ball) {
            const cOtherObject = otherObj as CircleColliderResult;
            Math2D.calculateElasticCollisionVelocity(
                this.velocity,
                this.velocity,
                normal,
                this.elasticity * otherObj.owner.elasticity,
                thisObj.velocity,
                (thisObj.owner as Ball).mass,
                cOtherObject.velocity,
                (cOtherObject.owner as Ball).mass
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
                (thisObj.owner as Ball).mass
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

    onAttachSurface(obj: Surface | GameObject2D) {
        this.surfaces.push(obj);
    }

    onDetachSurface(obj: Surface | GameObject2D) {
        const index = this.surfaces.findIndex((surface) => {
            const sSurface = surface as Surface;
            const sObj = obj as Surface;
            if (!sSurface.isBoundingBoxPlane) {
                return surface == obj;
            }
            if (!sObj.isBoundingBoxPlane) return false;
            if (surface.parent != obj.parent) return false;
            if (sSurface.plane[0] != sObj.plane[0] || sSurface.plane[1] != sObj.plane[1])
                return false;

            return true;
        });

        if (index != -1) this.surfaces.splice(index, 1);
    }

    draw(camera: DefaultCamera, _time: RefreshTime) {
        camera.context.fillStyle = this.color;
        camera.context.beginPath();

        camera.context.arc(this.position[0], this.position[1], this.radius, 0, Math2D.twoPi);
        camera.context.fill();
    }
}
