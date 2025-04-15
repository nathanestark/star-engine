import { vec3 } from "gl-matrix";
import GameObject from "source/core/game-object";
import Body from "./body";

export interface ColliderProperties {
    rocheLimitOn?: Boolean;
}

export default class Collider extends GameObject {
    rocheLimitOn: Boolean;

    constructor({ rocheLimitOn }: ColliderProperties = { rocheLimitOn: false }) {
        super();

        this.rocheLimitOn = false;
        if (typeof rocheLimitOn === "boolean") this.rocheLimitOn = rocheLimitOn;
    }

    update(tDelta: number) {
        // Grab all world objects that have radius.
        const objs = this.game.filter("body").filter(function (obj) {
            return (obj as Body).radius > 0;
        }) as Array<Body>;

        const remove = [];
        // Compare each one and calculate distance to each other to see if they've collided.
        for (let i = 0; i < objs.length; i++) {
            if (objs[i].removed) continue;
            for (let j = i + 1; j < objs.length; j++) {
                if (objs[j].removed) continue;

                const p1 = objs[i].position;
                const p2 = objs[j].position;

                const v1 = objs[i].velocity;
                const v2 = objs[j].velocity;

                const r1 = objs[i].radius;
                const r2 = objs[j].radius;

                const sDiff = vec3.sub(vec3.create(), p1, p2);
                const r = r1 + r2;
                const c = vec3.dot(sDiff, sDiff) - r * r;

                let collisionTime = -1;
                if (c < 0) {
                    // We have a collision.
                    collisionTime = 0;
                } else {
                    // If we are just outside of the time this slice for a collision to occur, we will not
                    // count as a collision. Next frame however, if the velocity changed due to an acceleration,
                    // It could be enough to place the object on the opposite sides of their travel, this avoiding
                    // the collision, and causing them to 'warp' past each other.

                    const vDiff = vec3.sub(vec3.create(), v1, v2);
                    const a = vec3.dot(vDiff, vDiff);
                    const b = vec3.dot(vDiff, sDiff);
                    if (b < 0) {
                        const d = b * b - a * c;
                        if (d > 0) {
                            collisionTime = (-b - Math.sqrt(d)) / a;
                            // If t is greater than tDelta, then we won't collide in this interval.
                            // If it is less than 2xtDelta, then we will next time...
                            if (collisionTime > tDelta) {
                                if (collisionTime <= tDelta * 2) {
                                    collisionTime = 0; // Count it as now.
                                }
                                collisionTime = -1;
                            }
                        }
                    }
                }

                // Now we know if we're going to collide, and when.
                if (collisionTime >= 0) {
                    // This isn't exact. I don't all the primary body to continue until the time of impact
                    // before combining the mass and velocity. So from the start of the next interval (during
                    // which they should impact at sometime), they will be moving already combined.

                    let primary = objs[i];
                    let secondary = objs[j];
                    if (r1 <= r2) {
                        // Swap primary and secondary.
                        primary = objs[j];
                        secondary = objs[i];
                    }
                    // Remove secondary
                    secondary.removed = true;
                    remove.push(secondary);

                    // Calc new velocity first (inelastic collision)
                    vec3.scale(primary.velocity, primary.velocity, primary.mass);
                    vec3.scale(secondary.velocity, secondary.velocity, secondary.mass);
                    vec3.add(primary.velocity, primary.velocity, secondary.velocity);
                    vec3.scale(
                        primary.velocity,
                        primary.velocity,
                        1 / (primary.mass + secondary.mass)
                    );

                    // Then calc mass.
                    primary.mass = primary.mass + secondary.mass;
                    // Recalc radius.
                    primary.radius = Math.pow(primary.mass / ((4 * Math.PI) / 3), 1 / 3);
                    // } else if (this.rocheLimitOn) {
                    //     const m1 = objs[i].mass;
                    //     const m2 = objs[j].mass;

                    //     let secondary = objs[i];
                    //     let primary = objs[j];
                    //     if (m1 > m2) {
                    //         secondary = objs[j];
                    //         primary = objs[i];
                    //     }
                    //     const rm = secondary.radius;
                    //     const mM = primary.mass;
                    //     const mm = secondary.mass;

                    //     const rDist = 1.26 * rm * Math.pow(mM / mm, 1 / 3);
                    //     if (dist <= rDist) {
                    //         // Split into multiples.
                    //         console.log("Inside Roche Limit: " + objs[i].id + " and " + objs[j].id);
                    //     }
                }
            }
        }

        // Remove any that are combined
        for (let x = 0; x < remove.length; x++) {
            this._game.removeGameObject(remove[x].id);
        }
    }
}
