import { vec2 } from "gl-matrix";
import Math2D from "../math-2d";

export default class ColliderOperations {
    static testCircleOnCircleCollisons(collider1, collider2) {
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
            const len1 = vec2.dot(norm1, collider1.parent.totalForce);
            const len2 = vec2.dot(norm2, collider2.parent.totalForce);

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
                        parent: collider1.parent,
                        position: pos1,
                        normal: norm1,
                        velocity: vec2.clone(collider1.velocity),
                        timeLeft: t,
                        radius: collider1.radius
                    },
                    obj2: {
                        collider: collider2,
                        parent: collider2.parent,
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
    static testCircleOnBoundingBoxCollisions(circleCollider, bbCollider) {
        // We want to compare the edge of the circle with the bounds of the box,
        // not the position point. So just shrink the box by the radius; then we
        // can check the position.
        const points = Math2D.inflateBoundingBox(bbCollider.bounds, -circleCollider.radius);

        // Find out if we've exited our bounding box.
        if (!Math2D.pointInBoundingBox(circleCollider.position, points)) {
            const collisions = [];

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
                            parent: circleCollider.parent,
                            position: pos1,
                            normal: vec2.fromValues((1 - axis) * (1 - pI * 2), axis * (1 - pI * 2)),
                            velocity: vec2.clone(circleCollider.velocity),
                            timeLeft: t,
                            radius: circleCollider.radius
                        },
                        obj2: {
                            collider: bbCollider,
                            parent: bbCollider.parent,
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

    static testBoundingBoxOnBoundingBoxCollisions(collider1, collider2) {
        // A bounding box has no velocity, so we just need to check and see
        // if we have any overlap.
        if (Math2D.boundingBoxIntersectsBoundingBox(collider1.bounds, collider2.bounds)) {
            return [
                {
                    obj1: {
                        collider: collider1,
                        parent: collider1.parent
                    },
                    obj2: {
                        collider: collider2,
                        parent: collider2.parent
                    }
                }
            ];
        }
        return null;
    }
}
