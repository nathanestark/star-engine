import { vec3 } from "gl-matrix";

export function normalizeBox(box: [vec3, vec3]): [vec3, vec3] {
    const [p1, p2] = box;
    return [
        [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.min(p1[2], p2[2])],
        [Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1]), Math.max(p1[2], p2[2])]
    ];
}

export function pointInBoundingBox(point: vec3, boxPoints: [vec3, vec3]): boolean {
    const [min, max] = normalizeBox(boxPoints);

    return (
        point[0] >= min[0] &&
        point[0] <= max[0] &&
        point[1] >= min[1] &&
        point[1] <= max[1] &&
        point[2] >= min[2] &&
        point[2] <= max[2]
    );
}

export function boundingBoxIntersectsBoundingBox(
    boxPointsA: [vec3, vec3],
    boxPointsB: [vec3, vec3]
): boolean {
    const [minA, maxA] = normalizeBox(boxPointsA);
    const [minB, maxB] = normalizeBox(boxPointsB);

    return (
        maxA[0] >= minB[0] &&
        minA[0] <= maxB[0] &&
        maxA[1] >= minB[1] &&
        minA[1] <= maxB[1] &&
        maxA[2] >= minB[2] &&
        minA[2] <= maxB[2]
    );
}

export function sphereIntersectsBoundingBox(
    point: vec3,
    radius: number,
    boxPoints: [vec3, vec3]
): boolean {
    const [min, max] = normalizeBox(boxPoints);

    const dX = Math.max(min[0], Math.min(point[0], max[0])) - point[0];
    const dY = Math.max(min[1], Math.min(point[1], max[1])) - point[1];
    const dZ = Math.max(min[2], Math.min(point[2], max[2])) - point[2];

    return dX * dX + dY * dY + dZ * dZ < radius * radius;
}

export function sphereOnBoundingBox(
    point: vec3,
    radius: number,
    boxPoints: [vec3, vec3]
): 0 | 1 | 2 {
    if (!sphereIntersectsBoundingBox(point, radius, boxPoints))
        return 0; // Outside
    else {
        if (
            point[0] - boxPoints[0][0] > radius &&
            point[1] - boxPoints[0][1] > radius &&
            point[2] - boxPoints[0][2] > radius &&
            boxPoints[1][0] - point[0] > radius &&
            boxPoints[1][1] - point[1] > radius &&
            boxPoints[1][2] - point[2] > radius
        ) {
            return 2; // Completely contained
        } else {
            return 1; // Overlapping edge.
        }
    }
}

export function boundingBoxOnBoundingBox(
    boxPointsA: [vec3, vec3],
    boxPointsB: [vec3, vec3]
): 0 | 1 | 2 {
    const [minA, maxA] = normalizeBox(boxPointsA);
    const [minB, maxB] = normalizeBox(boxPointsB);

    // Are we completely inside?
    if (
        minA[0] >= minB[0] &&
        maxA[0] <= maxB[0] &&
        minA[1] >= minB[1] &&
        maxA[1] <= maxB[1] &&
        minA[2] >= minB[2] &&
        maxA[2] <= maxB[2]
    ) {
        return 2;
    }

    // Do we have any overlap at all?
    const isOverlap =
        maxA[0] >= minB[0] &&
        minA[0] <= maxB[0] && // X
        maxA[1] >= minB[1] &&
        minA[1] <= maxB[1] && // Y
        maxA[2] >= minB[2] &&
        minA[2] <= maxB[2]; // Z

    if (isOverlap) {
        return 1;
    }

    // No overlap
    return 0;
}

export function sphereIntersectsSphere(
    pointA: vec3,
    radiusA: number,
    pointB: vec3,
    radiusB: number
): boolean {
    const minDist = radiusA + radiusB;
    return vec3.sqrDist(pointA, pointB) < minDist * minDist;
}

export function createBoundingBoxFromPoly(polygonPoints: Array<vec3>): [vec3, vec3] {
    if (polygonPoints.length == 0) throw new Error("Invalid number of points: 0");

    let bpMinX = Number.POSITIVE_INFINITY;
    let bpMinY = Number.POSITIVE_INFINITY;
    let bpMinZ = Number.POSITIVE_INFINITY;
    let bpMaxX = Number.NEGATIVE_INFINITY;
    let bpMaxY = Number.NEGATIVE_INFINITY;
    let bpMaxZ = Number.NEGATIVE_INFINITY;

    for (let p = 0; p < polygonPoints.length; p++) {
        const point = polygonPoints[p];

        if (point[0] < bpMinX) bpMinX = point[0];
        if (point[0] > bpMaxX) bpMaxX = point[0];
        if (point[1] < bpMinY) bpMinY = point[1];
        if (point[1] > bpMaxY) bpMaxY = point[1];
        if (point[2] < bpMinZ) bpMinZ = point[2];
        if (point[2] > bpMaxZ) bpMaxZ = point[2];
    }

    return [vec3.fromValues(bpMinX, bpMinY, bpMaxZ), vec3.fromValues(bpMaxX, bpMaxY, bpMaxZ)];
}

export function createBoundingBoxFromCircle(point: vec3, radius: number): [vec3, vec3] {
    const bpMinX = point[0] - radius;
    const bpMinY = point[1] - radius;
    const bpMinZ = point[2] - radius;
    const bpMaxX = point[0] + radius;
    const bpMaxY = point[1] + radius;
    const bpMaxZ = point[2] + radius;

    return [vec3.fromValues(bpMinX, bpMinY, bpMinZ), vec3.fromValues(bpMaxX, bpMaxY, bpMaxZ)];
}

export function inflateBoundingBox(boxPoints: [vec3, vec3], amount: number): [vec3, vec3];
export function inflateBoundingBox(
    boxPoints: [vec3, vec3],
    width: number,
    height?: number,
    depth?: number
): [vec3, vec3] {
    if (typeof height === "undefined") height = width;
    if (typeof depth === "undefined") depth = height;
    return [
        vec3.fromValues(boxPoints[0][0] - width, boxPoints[0][1] - height, boxPoints[0][2] - depth),
        vec3.fromValues(boxPoints[1][0] + width, boxPoints[1][1] + height, boxPoints[1][2] + depth)
    ];
}

export function pointsApproaching(p1: vec3, v1: vec3, p2: vec3, v2: vec3) {
    // Find out if they're moving towards each other.
    const temp = vec3.create();
    const temp2 = vec3.create();
    vec3.sub(temp, v1, v2);
    vec3.sub(temp2, p1, p2);
    return vec3.dot(temp, temp2) < 0;
}

export const twoPi = Math.PI * 2;
