import {vec2} from 'gl-matrix';
import Math2D from '../math-2d';

export default class ColliderOperations {

    static testCircleOnCircleCollisons(collider1, collider2) {
        // If the objects overlap and were moving towards each other, it is a
        // collision.
        if (Math2D.circleIntersectsCircle(collider1.position, collider1.radius, 
                                         collider2.position, collider2.radius)
            && Math2D.pointsApproaching(collider1.position, collider1.velocity, 
                                        collider2.position, collider2.velocity)) {

            // Calculate how long ago the collision took place.
            let t = 0;
            const temp = vec2.create();
            vec2.sub(temp, collider1.position, collider2.position);
            const p = vec2.length(temp);
            vec2.sub(temp, collider1.velocity, collider2.velocity);
            const v = vec2.length(temp);

            t = (p - (collider1.radius + collider2.radius + Number.EPSILON)) / v;

            // Negate t.
            t = -t;

            const pos1 = vec2.create();
            // Calculate displacement by t (should be negative time)
            // to get position at time of collision.
            vec2.scale(pos1, collider1.velocity, t);
            vec2.add(pos1, collider1.position, pos1);

            // Get other object's collision position
            const pos2 = vec2.create();
            vec2.scale(pos2, collider2.velocity, t);
            vec2.add(pos2, collider2.position, pos2);

            // Calculate the normals of the collision
            const norm1 = vec2.create();
            vec2.sub(norm1, pos2, pos1); 
            vec2.normalize(norm1, norm1);

            const norm2 = vec2.create();
            vec2.negate(norm2, norm1);

            // Calculate time left.
            t = -t; 

            return [{
                obj1: {
                    collider: collider1,
                    parent: collider1.parent,
                    position: pos1, 
                    normal: norm1,
                    velocity: vec2.clone(collider1.velocity), 
                    timeLeft: t,
                    radius: collider1.radius,
                },
                obj2: {
                    collider: collider2,
                    parent: collider2.parent,
                    position: pos2,
                    normal: norm2,
                    velocity: vec2.clone(collider2.velocity), 
                    timeLeft: t,
                    radius: collider2.radius,
                }   
            }];
        }
        return null;
    }
    static testCircleOnBoundingBoxCollisions(circleCollider, bbCollider) {

        // We want to compare the edge of the circle with the bounds of the box,
        // not the position point. So just shrink the box by the radius; then we
        // can check the position.
        const points = Math2D.inflateBoundingBox(bbCollider.bounds, -circleCollider.radius);

        // Find out if we've exited our bounding box.
        if(!Math2D.pointInBoundingBox(circleCollider.position, points)) {
            const collisions = [];

            // Check if we hit the bottom Y plane.
            if((points[1][1] - circleCollider.position[1]) < 0)
            {
                // Calculate how long ago the collision took place.
                let t = (Math.abs(circleCollider.position[1] - points[1][1]) 
                            - Number.EPSILON) / Math.abs(circleCollider.velocity[1]);

                // Negate t.
                t = -t;

                const pos1 = vec2.create();
                // Calculate displacement by t (should be negative time)
                // to get position at time of collision.
                vec2.scale(pos1, circleCollider.velocity, t);
                vec2.add(pos1, circleCollider.position, pos1);
                
                // Calculate time left.
                t = -t; 
                
                collisions.push({                
                    obj1: {
                        collider: circleCollider,
                        parent: circleCollider.parent,
                        position: pos1, 
                        normal: vec2.fromValues(0, -1),
                        velocity: vec2.clone(circleCollider.velocity), 
                        timeLeft: t,
                        radius: circleCollider.radius,
                    },
                    obj2: {
                        collider: bbCollider,
                        parent: bbCollider.parent,
                        plane: vec2.fromValues(0, points[1][1]),
                    }   
                });
            }
            // Then left X plane.
            if((points[0][0] - circleCollider.position[0]) > 0)
            {
                // Calculate how long ago the collision took place.
                let t = (Math.abs(circleCollider.position[0] - points[0][0]) 
                            - Number.EPSILON) / Math.abs(circleCollider.velocity[0]);

                // Negate t.
                t = -t;

                const pos1 = vec2.create();
                // Calculate displacement by t (should be negative time)
                // to get position at time of collision.
                vec2.scale(pos1, circleCollider.velocity, t);
                vec2.add(pos1, circleCollider.position, pos1);
                
                // Calculate time left.
                t = -t; 
                
                collisions.push({                
                    obj1: {
                        collider: circleCollider,
                        parent: circleCollider.parent,
                        position: pos1, 
                        normal: vec2.fromValues(1, 0),
                        velocity: vec2.clone(circleCollider.velocity), 
                        timeLeft: t,
                        radius: circleCollider.radius,
                    },
                    obj2: {
                        collider: bbCollider,
                        parent: bbCollider.parent,
                        plane: vec2.fromValues(points[0][0], 0),
                    }   
                });
            }
            // Then right X plane.
            if((points[1][0] - circleCollider.position[0]) < 0)
            {
                // Calculate how long ago the collision took place.
                let t = (Math.abs(circleCollider.position[0] - points[1][0]) 
                            - Number.EPSILON) / Math.abs(circleCollider.velocity[0]);

                // Negate t.
                t = -t;

                const pos1 = vec2.create();
                // Calculate displacement by t (should be negative time)
                // to get position at time of collision.
                vec2.scale(pos1, circleCollider.velocity, t);
                vec2.add(pos1, circleCollider.position, pos1);
                
                // Calculate time left.
                t = -t; 
                
                collisions.push({                
                    obj1: {
                        collider: circleCollider,
                        parent: circleCollider.parent,
                        position: pos1, 
                        normal: vec2.fromValues(-1, 0),
                        velocity: vec2.clone(circleCollider.velocity), 
                        timeLeft: t,
                        radius: circleCollider.radius,
                    },
                    obj2: {
                        collider: bbCollider,
                        parent: bbCollider.parent,
                        plane: vec2.fromValues(points[1][0], 0),
                    }   
                });
            }
            // Then top Y plane.
            if((points[0][1] - circleCollider.position[1]) > 0)
            {
                // Calculate how long ago the collision took place.
                let t = (Math.abs(circleCollider.position[1] - points[0][1]) 
                            - Number.EPSILON) / Math.abs(circleCollider.velocity[1]);

                // Negate t.
                t = -t;

                const pos1 = vec2.create();
                // Calculate displacement by t (should be negative time)
                // to get position at time of collision.
                vec2.scale(pos1, circleCollider.velocity, t);
                vec2.add(pos1, circleCollider.position, pos1);
                
                // Calculate time left.
                t = -t; 
                
                collisions.push({                
                    obj1: {
                        collider: circleCollider,
                        parent: circleCollider.parent,
                        position: pos1, 
                        normal: vec2.fromValues(0, 1),
                        velocity: vec2.clone(circleCollider.velocity), 
                        timeLeft: t,
                        radius: circleCollider.radius,
                    },
                    obj2: {
                        collider: bbCollider,
                        parent: bbCollider.parent,
                        plane: vec2.fromValues(0, points[0][1]),
                    }   
                });
            }

            return collisions;
        }

        return null;
    }

    static testBoundingBoxOnBoundingBoxCollisions(collider1, collider2) {
        
        // A bounding box has no velocity, so we just need to check and see
        // if we have any overlap.
        if (Math2D.boundingBoxIntersectsBoundingBox(collider1.bounds, collider2.bounds)) {
            return [{
                obj1: {
                    collider: collider1,
                    parent: collider1.parent
                },   
                obj2: {
                    collider: collider2,
                    parent: collider2.parent
                }   
            }]
        }
        return null;
    }
}