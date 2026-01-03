import { ReadonlyVec2, ReadonlyVec3, vec2, vec3 } from "gl-matrix";
import { geoDelaunay } from "d3-geo-voronoi";

function generateSphere(
    radius = 1,
    numSamples = 1024
): {
    verticies: Array<number>;
    indices: Array<number>;
} {
    const projection = [] as Array<vec2>;
   
    const finalVerticies: Array<number> = [
        // pos.x, pos.y, pos.z, uv.u, uv.v, normal.x, normal.y, normal.z
    ];
    const finalIndices: Array<number> = [];

    const phi = Math.PI * (Math.sqrt(5.0) - 1.0);  // golden angle in radians
    for (let i = 0; i < numSamples; i++) {
        const y = 1.0 - (i / (numSamples - 1)) * 2.0; // y goes from 1 to -1
        const yRadius = Math.sqrt(1 - y * y);  // radius at y
        const theta = i * phi;
        const x = Math.cos(theta) * yRadius;
        const z = Math.sin(theta) * yRadius;
        const u = -0.5 * ((theta % (Math.PI * 2)) / Math.PI) + 1;
        const v = -(Math.acos(y) / Math.PI) + 1;
        
        const plane_x = x / (1 - z);
        const plane_y = y / (1 - z);
        projection.push(vec2.fromValues(plane_x, plane_y));

        finalVerticies.push(
            radius * x,
            radius * y,
            radius * z,

            u,
            v,

            x,
            y,
            z
        );
    }
    const {triangles} = geoDelaunay(projection);
    let extra = 0;
    for (let i = 0; i < triangles.length; i++) {
        let [t0, t1, t2] = triangles[i];
        const u0 = finalVerticies[t0 * 8 + 3];
        const u1 = finalVerticies[t1 * 8 + 3];
        const u2 = finalVerticies[t2 * 8 + 3];
        const v0 = finalVerticies[t0 * 8 + 4];
        const v1 = finalVerticies[t1 * 8 + 4];
        const v2 = finalVerticies[t2 * 8 + 4];
        const u01Diff = Math.abs(u0 - u1);
        const u02Diff = Math.abs(u0 - u2);
        const u12Diff = Math.abs(u1 - u2);
        const u01Over = u01Diff > 0.5;
        const u02Over = u02Diff > 0.5;
        const u12Over = u12Diff > 0.5;

        // Pole polishing logic
        if (v0 < 0.01 || v0 > 0.99)
        {
            const average = 0.5 * (u1 + u2);
            finalVerticies.push(
                finalVerticies[t0 * 8 + 0],
                finalVerticies[t0 * 8 + 1],
                finalVerticies[t0 * 8 + 2],
                average,
                finalVerticies[t0 * 8 + 4],
                finalVerticies[t0 * 8 + 5],
                finalVerticies[t0 * 8 + 6],
                finalVerticies[t0 * 8 + 7],
            );
            t0 = numSamples + extra++;
        }
        else if (v1 < 0.01 || v1 > 0.99)
        {
            const average = 0.5 * (u0 + u2);
            finalVerticies.push(
                finalVerticies[t1 * 8 + 0],
                finalVerticies[t1 * 8 + 1],
                finalVerticies[t1 * 8 + 2],
                average,
                finalVerticies[t1 * 8 + 4],
                finalVerticies[t1 * 8 + 5],
                finalVerticies[t1 * 8 + 6],
                finalVerticies[t1 * 8 + 7],
            );
            t1 = numSamples + extra++;
        }
        else if (v2 < 0.01 || v2 > 0.99)
        {
            const average = 0.5 * (u0 + u1);
            finalVerticies.push(
                finalVerticies[t2 * 8 + 0],
                finalVerticies[t2 * 8 + 1],
                finalVerticies[t2 * 8 + 2],
                average,
                finalVerticies[t2 * 8 + 4],
                finalVerticies[t2 * 8 + 5],
                finalVerticies[t2 * 8 + 6],
                finalVerticies[t2 * 8 + 7],
            );
            t2 = numSamples + extra++;
        }
        
        // Seam handling
        if (u01Over && u02Over)
        {
            const delta = u0 < 0.5 ? 1 : -1;
            finalVerticies.push(
                finalVerticies[t0 * 8 + 0],
                finalVerticies[t0 * 8 + 1],
                finalVerticies[t0 * 8 + 2],
                finalVerticies[t0 * 8 + 3] + delta,
                finalVerticies[t0 * 8 + 4],
                finalVerticies[t0 * 8 + 5],
                finalVerticies[t0 * 8 + 6],
                finalVerticies[t0 * 8 + 7],
            );
            t0 = numSamples + extra++;
        }
        else if (u01Over && u12Over)
        {
            const delta = u1 < 0.5 ? 1 : -1;
            finalVerticies.push(
                finalVerticies[t1 * 8 + 0],
                finalVerticies[t1 * 8 + 1],
                finalVerticies[t1 * 8 + 2],
                finalVerticies[t1 * 8 + 3] + delta,
                finalVerticies[t1 * 8 + 4],
                finalVerticies[t1 * 8 + 5],
                finalVerticies[t1 * 8 + 6],
                finalVerticies[t1 * 8 + 7],
            );
            t1 = numSamples + extra++;
        }
        else if (u02Over && u12Over)
        {
            const delta = u2 < 0.5 ? 1 : -1;
            finalVerticies.push(
                finalVerticies[t2 * 8 + 0],
                finalVerticies[t2 * 8 + 1],
                finalVerticies[t2 * 8 + 2],
                finalVerticies[t2 * 8 + 3] + delta,
                finalVerticies[t2 * 8 + 4],
                finalVerticies[t2 * 8 + 5],
                finalVerticies[t2 * 8 + 6],
                finalVerticies[t2 * 8 + 7],
            );
            t2 = numSamples + extra++;
        }

        finalIndices.push(t0);
        finalIndices.push(t1);
        finalIndices.push(t2);
    }

    return {
        verticies: finalVerticies,
        indices: finalIndices
    };
}

export const Sphere = generateSphere(1, 1024);
