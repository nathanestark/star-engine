import { vec2 } from "gl-matrix";

const turn = function (p1: vec2, p2: vec2, p3: vec2): number {
    const a = (p3[0] - p1[0]) * (p2[1] - p1[1]);
    const b = (p2[0] - p1[0]) * (p3[1] - p1[1]);
    return a > b + Number.EPSILON ? 1 : a + Number.EPSILON < b ? -1 : 0;
};

export function pointInPolygon(point: vec2, polygonPoints: Array<vec2>): boolean {
    // First check if the point is the bounding boxPoints.
    if (pointInBoundingBox(point, createBoundingBoxFromPoly(polygonPoints))) {
        // if it is in the bounding box, then test if it is in the shape.

        // Do a 'ray cast' from some position to our point.
        const outPoint = vec2.fromValues(Number.MIN_VALUE, point[1]);

        const lSeg1: [vec2, vec2] = [outPoint, point];
        const lSeg2: [null | vec2, null | vec2] = [null, null];

        let inside = false;
        for (let p = 0; p < polygonPoints.length; p++) {
            lSeg2[0] = lSeg2[1]; // Shift last one over.
            lSeg2[1] = polygonPoints[p]; // Set new point.
            if (lSeg2[0] != null && intersectingLines(lSeg1, lSeg2)) inside = !inside;
        }

        // Finally, we need to test the last segment.
        lSeg2[0] = lSeg2[1]; // Shift last one over.
        lSeg2[1] = polygonPoints[0]; // Set new point.

        if (intersectingLines(lSeg1, lSeg2)) inside = !inside;

        return inside;
    }

    return false;
}

export function pointInBoundingBox(point: vec2, boxPoints: [vec2, vec2]): boolean {
    if (
        point[0] < boxPoints[0][0] ||
        point[1] < boxPoints[0][1] ||
        point[0] > boxPoints[1][0] ||
        point[1] > boxPoints[1][1]
    ) {
        return false;
    }

    return true;
}

export function boundingBoxIntersectsBoundingBox(
    boxPointsA: [vec2, vec2],
    boxPointsB: [vec2, vec2]
): boolean {
    const aWidth = boxPointsA[1][0] - boxPointsA[0][0];
    const bWidth = boxPointsB[1][0] - boxPointsB[0][0];
    const aHeight = boxPointsA[1][1] - boxPointsA[0][1];
    const bHeight = boxPointsB[1][1] - boxPointsB[0][1];

    return (
        Math.abs(boxPointsA[0][0] - boxPointsB[0][0]) * 2 < aWidth + bWidth &&
        Math.abs(boxPointsA[0][1] - boxPointsB[0][1]) * 2 < aHeight + bHeight
    );
}

export function circleIntersectsBoundingBox(
    point: vec2,
    radius: number,
    boxPoints: [vec2, vec2]
): boolean {
    const dX = point[0] - Math.max(boxPoints[0][0], Math.min(point[0], boxPoints[1][0]));
    const dY = point[1] - Math.max(boxPoints[0][1], Math.min(point[1], boxPoints[1][1]));

    return dX * dX + dY * dY < radius * radius;
}

export function circleOnBoundingBox(
    point: vec2,
    radius: number,
    boxPoints: [vec2, vec2]
): 0 | 1 | 2 {
    if (!circleIntersectsBoundingBox(point, radius, boxPoints))
        return 0; // Outside
    else {
        if (
            point[0] - boxPoints[0][0] > radius &&
            point[1] - boxPoints[0][1] > radius &&
            boxPoints[1][0] - point[0] > radius &&
            boxPoints[1][1] - point[1] > radius
        ) {
            return 2; // Completely contained
        } else {
            return 1; // Overlapping edge.
        }
    }
}

export function boundingBoxOnBoundingBox(
    boxPointsA: [vec2, vec2],
    boxPointsB: [vec2, vec2]
): 0 | 1 | 2 {
    const dA1B1X = boxPointsA[0][0] - boxPointsB[0][0];
    const dA1B1Y = boxPointsA[0][1] - boxPointsB[0][1];
    const dA1B2X = boxPointsA[0][0] - boxPointsB[1][0];
    const dA1B2Y = boxPointsA[0][1] - boxPointsB[1][1];

    const dA2B1X = boxPointsA[1][0] - boxPointsB[0][0];
    const dA2B1Y = boxPointsA[1][1] - boxPointsB[0][1];
    const dA2B2X = boxPointsA[1][0] - boxPointsB[1][0];
    const dA2B2Y = boxPointsA[1][1] - boxPointsB[1][1];

    // Are we completely inside?
    if (
        dA1B1X > 0 &&
        dA1B1Y > 0 &&
        dA1B2X < 0 &&
        dA1B2Y < 0 &&
        dA2B1X > 0 &&
        dA2B1Y > 0 &&
        dA2B2X > 0 &&
        dA2B2Y < 0
    ) {
        return 2;
    }

    // Is one of our box's points inside the other box?
    if (
        pointInBoundingBox(boxPointsA[0], boxPointsB) ||
        pointInBoundingBox(boxPointsA[1], boxPointsB) ||
        pointInBoundingBox(boxPointsB[0], boxPointsA) ||
        pointInBoundingBox(boxPointsB[1], boxPointsA)
    ) {
        // Then we have overlap somewhere.
        return 1;
    }

    // Last, we need to check this condition:
    //
    //    +--+
    //  +------+
    //  | |  | |
    //  +------+
    //    +--+
    //
    if (
        (dA1B1X > 0 && dA2B2X < 0 && dA1B1Y < 0 && dA2B2Y > 0) ||
        (dA1B1X < 0 && dA2B2X > 0 && dA1B1Y > 0 && dA2B2Y < 0)
    ) {
        return 1;
    }

    // Otherwise, no overlap at all.
    return 0;
}

export function circleIntersectsCircle(
    pointA: vec2,
    radiusA: number,
    pointB: vec2,
    radiusB: number
): boolean {
    const minDist = radiusA + radiusB;
    return vec2.sqrDist(pointA, pointB) < minDist * minDist;
}

export function createBoundingBoxFromPoly(polygonPoints: Array<vec2>): [vec2, vec2] {
    if (polygonPoints.length == 0) throw new Error("Invalid number of points: 0");

    let bpMinX = Number.POSITIVE_INFINITY;
    let bpMinY = Number.POSITIVE_INFINITY;
    let bpMaxX = Number.NEGATIVE_INFINITY;
    let bpMaxY = Number.NEGATIVE_INFINITY;

    for (let p = 0; p < polygonPoints.length; p++) {
        const point = polygonPoints[p];

        if (point[0] < bpMinX) bpMinX = point[0];
        if (point[0] > bpMaxX) bpMaxX = point[0];
        if (point[1] < bpMinY) bpMinY = point[1];
        if (point[1] > bpMaxY) bpMaxY = point[1];
    }

    return [vec2.fromValues(bpMinX, bpMinY), vec2.fromValues(bpMaxX, bpMaxY)];
}

export function createBoundingBoxFromCircle(point: vec2, radius: number): [vec2, vec2] {
    const bpMinX = point[0] - radius;
    const bpMinY = point[1] - radius;
    const bpMaxX = point[0] + radius;
    const bpMaxY = point[1] + radius;

    return [vec2.fromValues(bpMinX, bpMinY), vec2.fromValues(bpMaxX, bpMaxY)];
}

export function intersectingLines(lineAPoints: [vec2, vec2], lineBPoints: [vec2, vec2]): boolean {
    return (
        turn(lineAPoints[0], lineBPoints[0], lineBPoints[1]) !=
            turn(lineAPoints[1], lineBPoints[0], lineBPoints[1]) &&
        turn(lineAPoints[0], lineAPoints[1], lineBPoints[0]) !=
            turn(lineAPoints[0], lineAPoints[1], lineBPoints[1])
    );
}

export function inflateBoundingBox(boxPoints: [vec2, vec2], amount: number): [vec2, vec2];
export function inflateBoundingBox(
    boxPoints: [vec2, vec2],
    width: number,
    height?: number
): [vec2, vec2] {
    if (typeof height === "undefined") height = width;
    return [
        vec2.fromValues(boxPoints[0][0] - width, boxPoints[0][1] - height),
        vec2.fromValues(boxPoints[1][0] + width, boxPoints[1][1] + height)
    ];
}

export function pointsApproaching(p1: vec2, v1: vec2, p2: vec2, v2: vec2) {
    // Find out if they're moving towards each other.
    const temp = vec2.create();
    const temp2 = vec2.create();
    vec2.sub(temp, v1, v2);
    vec2.sub(temp2, p1, p2);
    return vec2.dot(temp, temp2) < 0;
}

export function calculateElasticCollisionVelocity(
    out: vec2,
    curVelocity: vec2,
    normal: vec2,
    coefficientOfRestitution: number = 1,
    obj1Velocity: vec2,
    obj1Mass: number = 1,
    obj2Velocity: vec2 | null = null,
    obj2Mass: number = 1
): vec2 {
    const temp = vec2.create();
    const temp2 = vec2.create();

    // Calculate new velocity for after the collision, and update our velocity.
    if (obj2Velocity) {
        const v1Parallel = vec2.create();
        const v2Parallel = vec2.create();
        const v1Ortho = vec2.create();

        // Break into parallel and orthogonal components.

        vec2.scale(v1Parallel, normal, vec2.dot(obj1Velocity, normal));
        vec2.scale(v2Parallel, normal, vec2.dot(obj2Velocity, normal));
        vec2.sub(v1Ortho, obj1Velocity, v1Parallel);

        // Determine the new parallel component based on the two objects colliding.
        vec2.scale(temp, v1Parallel, obj1Mass - obj2Mass);
        vec2.scale(temp2, v2Parallel, 2 * obj2Mass);
        vec2.add(v1Parallel, temp, temp2);
        vec2.scale(v1Parallel, v1Parallel, coefficientOfRestitution / (obj1Mass + obj2Mass));

        // Remove the velocity component we knew about before the collision from the
        // current velocity (which could have been updated due to other collisions)
        vec2.sub(out, curVelocity, obj1Velocity);
        // Update velocity with the orthogonal and parallel parts.
        vec2.add(out, out, v1Ortho);
        vec2.add(out, out, v1Parallel);
    } else {
        // Otherwise, just use our info.
        // Reflect us across the normal.
        vec2.scale(temp, normal, (1 + coefficientOfRestitution) * vec2.dot(normal, obj1Velocity));

        // Apply to our current velocity, which may have already changed due to other
        // collisions this tick.
        vec2.sub(out, curVelocity, temp);
    }

    return out;
}

export function calculateInelasticCollisionVelocity(
    out: vec2,
    curVelocity: vec2,
    normal: vec2,
    obj1Velocity: vec2,
    obj1Mass: number = 1,
    obj2Velocity: vec2 | null = null,
    obj2Mass: number = 1
): vec2 {
    // Not sure this is accurate. Without angular momentum being taking into
    // account, how this would react is questionable.

    // vf = (m1v1 + m2v2)/(m1+m2)

    // Calculate new velocity for after the collision, and update our velocity.
    if (obj2Velocity) {
        const temp1 = vec2.create();
        const temp2 = vec2.create();

        const v1Parallel = vec2.create();
        const v2Parallel = vec2.create();
        const v1Ortho = vec2.create();

        // Break into parallel and orthogonal components.

        vec2.scale(v1Parallel, normal, vec2.dot(obj1Velocity, normal));
        vec2.scale(v2Parallel, normal, vec2.dot(obj2Velocity, normal));
        vec2.sub(v1Ortho, obj1Velocity, v1Parallel);

        // Determine the new parallel component based on the two objects colliding.
        vec2.scale(temp1, v1Parallel, obj1Mass);
        vec2.scale(temp2, v2Parallel, obj2Mass);
        vec2.add(v1Parallel, temp1, temp2);
        vec2.scale(v1Parallel, v1Parallel, 1 / (obj1Mass + obj2Mass));

        // Remove the velocity component we knew about before the collision from the
        // current velocity (which could have been updated due to other collisions)
        vec2.sub(out, curVelocity, obj1Velocity);
        // Update velocity with the orthogonal and parallel parts.
        vec2.add(out, out, v1Ortho);
        vec2.add(out, out, v1Parallel);
    } else {
        // If obj2 has null velocity, then count it as an infinite mass 'wall' or
        // something that we collided with. In this case, new new velocity is 0.
        vec2.copy(out, vec2.create());
    }

    return out;
}

export const twoPi = Math.PI * 2;
