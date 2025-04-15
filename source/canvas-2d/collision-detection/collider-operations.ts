import { vec2 } from "gl-matrix";
import * as Math2D from "../math-2d";
import Collider, { Collidable, ICollider } from "./collider";
import CircleCollider from "./circle-collider";
import BoundingBoxCollider from "./bounding-box-collider";

export interface CollisionResult {
    obj1: ColliderResult;
    obj2: ColliderResult;
}

export interface ColliderResult {
    collider: ICollider;
    owner: Collidable | null;
}

export interface CircleColliderResult extends ColliderResult {
    collider: CircleCollider;
    owner: Collidable | null;
    position: vec2;
    normal: vec2;
    velocity: vec2;
    timeLeft: number;
    radius: number;
}

export interface BoundingBoxColliderResult {
    collider: BoundingBoxCollider;
    owner: Collidable | null;
    plane: vec2;
}

export interface Results {}

export function testCircleOnCircleCollisons(
    collider1: CircleCollider,
    collider2: CircleCollider
): Array<{ obj1: CircleColliderResult; obj2: CircleColliderResult }> {
    // If the objects overlap and were moving towards each other, it is a
    // collision.
    if (
        Math2D.circleIntersectsCircle(
            collider1.position,
            collider1.radius,
            collider2.position,
            collider2.radius
        ) &&
        Math2D.pointsApproaching(
            collider1.position,
            collider1.velocity,
            collider2.position,
            collider2.velocity
        )
    ) {
        // Calculate how long ago the collision took place.
        let t = 0;
        const temp = vec2.create();
        vec2.sub(temp, collider1.position, collider2.position);
        const p = vec2.length(temp);
        vec2.sub(temp, collider1.velocity, collider2.velocity);
        const v = vec2.length(temp);

        const pos1 = vec2.create();
        const pos2 = vec2.create();

        if (v == 0) {
            t = 0;
            vec2.copy(pos1, collider1.position);
            vec2.copy(pos2, collider2.position);
        } else {
            t = (p - (collider1.radius + collider2.radius + Number.EPSILON)) / v;

            // Negate t.
            t = -t;

            // Calculate displacement by t (should be negative time)
            // to get position at time of collision.
            vec2.scale(pos1, collider1.velocity, t);
            vec2.add(pos1, collider1.position, pos1);

            // Get other object's collision position
            vec2.scale(pos2, collider2.velocity, t);
            vec2.add(pos2, collider2.position, pos2);
        }

        // Calculate the normals of the collision
        const norm1 = vec2.create();
        vec2.sub(norm1, pos2, pos1);
        vec2.normalize(norm1, norm1);

        const norm2 = vec2.create();
        vec2.negate(norm2, norm1);

        // Adjust the one applying the most force to the other.
        const len1 = vec2.dot(norm1, collider1.owner.totalForce);
        const len2 = vec2.dot(norm2, collider2.owner.totalForce);

        // Make sure the position is always outside. We'll only
        // adjust the first one.
        if (len1 >= len2) {
            vec2.scale(pos1, norm2, collider1.radius + collider2.radius);
            vec2.add(pos1, pos1, pos2);
            // console.log("Adjusting", len1,">=", len2, `(${prev[0]},${prev[1]})`, `(${pos1[0]},${pos1[1]})`)
        } else {
            vec2.scale(pos2, norm1, collider1.radius + collider2.radius);
            vec2.add(pos2, pos2, pos1);
            // console.log("Adjusting", len1,">=", len2, `(${prev[0]},${prev[1]})`, `(${pos2[0]},${pos2[1]})`)
        }

        // Calculate time left.
        t = -t;
        if (t == Number.POSITIVE_INFINITY || t == Number.NEGATIVE_INFINITY) {
            throw "Bad timeLeft";
        }

        return [
            {
                obj1: {
                    collider: collider1,
                    owner: collider1.owner,
                    position: pos1,
                    normal: norm1,
                    velocity: vec2.clone(collider1.velocity),
                    timeLeft: t,
                    radius: collider1.radius
                },
                obj2: {
                    collider: collider2,
                    owner: collider2.owner,
                    position: pos2,
                    normal: norm2,
                    velocity: vec2.clone(collider2.velocity),
                    timeLeft: t,
                    radius: collider2.radius
                }
            }
        ];
    }
    return null;
}
export function testCircleOnBoundingBoxCollisions(
    circleCollider: CircleCollider,
    bbCollider: BoundingBoxCollider
): Array<{ obj1: CircleColliderResult; obj2: BoundingBoxColliderResult }> {
    // We want to compare the edge of the circle with the bounds of the box,
    // not the position point. So just shrink the box by the radius; then we
    // can check the position.
    const points = Math2D.inflateBoundingBox(bbCollider.bounds, -circleCollider.radius);

    // Find out if we've exited our bounding box.
    if (!Math2D.pointInBoundingBox(circleCollider.position, points)) {
        const collisions: Array<{ obj1: CircleColliderResult; obj2: BoundingBoxColliderResult }> =
            [];

        [
            [1, 1],
            [0, 0],
            [1, 0],
            [0, 1]
        ].forEach(([pI, axis]) => {
            let collided = pI
                ? points[pI][axis] - circleCollider.position[axis] <= 0
                : points[pI][axis] - circleCollider.position[axis] >= 0;
            if (collided) {
                let t = 0;
                const pos1 = vec2.create();
                if (circleCollider.velocity[axis] == 0) {
                    vec2.copy(pos1, circleCollider.position);
                } else {
                    // Calculate how long ago the collision took place.
                    t =
                        (Math.abs(circleCollider.position[axis] - points[pI][axis]) -
                            Number.EPSILON) /
                        Math.abs(circleCollider.velocity[axis]);

                    // Negate t.
                    t = -t;

                    // Calculate displacement by t (should be negative time)
                    // to get position at time of collision.
                    vec2.scale(pos1, circleCollider.velocity, t);
                    vec2.add(pos1, circleCollider.position, pos1);

                    // Calculate time left.
                    t = -t;
                    if (t == Number.POSITIVE_INFINITY || t == Number.NEGATIVE_INFINITY) {
                        throw "Bad timeLeft";
                    }
                }

                // Make sure the position is always inside.
                pos1[axis] = pI
                    ? Math.min(pos1[axis], points[pI][axis])
                    : Math.max(pos1[axis], points[pI][axis]);

                collisions.push({
                    obj1: {
                        collider: circleCollider,
                        owner: circleCollider.owner,
                        position: pos1,
                        normal: vec2.fromValues((1 - axis) * (1 - pI * 2), axis * (1 - pI * 2)),
                        velocity: vec2.clone(circleCollider.velocity),
                        timeLeft: t,
                        radius: circleCollider.radius
                    },
                    obj2: {
                        collider: bbCollider,
                        owner: bbCollider.owner,
                        plane: vec2.fromValues(
                            (1 - axis) * points[pI][axis],
                            axis * points[pI][axis]
                        )
                    }
                });
            }
        });
        return collisions;
    }

    return null;
}

export function testBoundingBoxOnBoundingBoxCollisions(
    collider1: BoundingBoxCollider,
    collider2: BoundingBoxCollider
): Array<{ obj1: BoundingBoxColliderResult; obj2: BoundingBoxColliderResult }> {
    // A bounding box has no velocity, so we just need to check and see
    // if we have any overlap.
    // This premise is wrong as soon as we use a bounding box for any game object
    // other than borders.
    if (Math2D.boundingBoxIntersectsBoundingBox(collider1.bounds, collider2.bounds)) {
        return [
            {
                obj1: {
                    collider: collider1,
                    owner: collider1.owner,
                    plane: vec2.fromValues(1, 0) // FIX
                },
                obj2: {
                    collider: collider2,
                    owner: collider2.owner,
                    plane: vec2.fromValues(1, 0) // FIX
                }
            }
        ];
    }
    return null;
}
