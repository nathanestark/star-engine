import { ReadonlyVec2, ReadonlyVec3, vec2, vec3 } from "gl-matrix";

function getIndex<V extends ReadonlyVec3 | ReadonlyVec2>(
    list: Array<V>,
    item: V,
    exactEquals: (a: V, b: V) => boolean
): number {
    const index = list.findIndex((val) => exactEquals(val, item));
    if (index === -1) {
        list.push(item);
        return list.length - 1;
    }
    return index;
}

function generateSphere(
    radius = 1,
    numLat = 32,
    numLong = 32
): {
    verticies: Array<number>;
    indices: Array<number>;
} {
    const verticies = [] as Array<vec3>;
    const normals = [] as Array<vec3>;
    const uvs = [] as Array<vec2>;
    const sphere = {
        verticies: [] as Array<number>,
        uvs: [] as Array<number>,
        normals: [] as Array<number>,
        indexes: [] as Array<number>
    };

    for (let lat = 0; lat <= numLat; lat++) {
        const v = lat / numLat;
        const theta = v * Math.PI;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let long = 0; long <= numLong; long++) {
            const u = long / numLong;
            const phi = u * 2 * Math.PI;

            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            verticies.push(vec3.fromValues(radius * x, radius * y, radius * z));
            normals.push(vec3.fromValues(x, y, z));
            uvs.push(vec2.fromValues(u, v));
        }
    }

    const uVerticies = [] as Array<vec3>;
    const uNormals = [] as Array<vec3>;
    const uUvs = [] as Array<vec2>;

    for (let lat = 0; lat < numLat; lat++) {
        for (let long = 0; long < numLong; long++) {
            const indexA = lat * (numLong + 1) + long;
            const indexB = (lat + 1) * (numLong + 1) + long;
            const indexC = indexA + 1;
            const indexD = indexB + 1;

            // Write first triangle,
            sphere.indexes.push(
                getIndex(uVerticies, verticies[indexA], vec3.exactEquals),
                getIndex(uUvs, uvs[indexA], vec2.exactEquals),
                getIndex(uNormals, normals[indexA], vec3.exactEquals),

                getIndex(uVerticies, verticies[indexB], vec3.exactEquals),
                getIndex(uUvs, uvs[indexB], vec2.exactEquals),
                getIndex(uNormals, normals[indexB], vec3.exactEquals),

                getIndex(uVerticies, verticies[indexC], vec3.exactEquals),
                getIndex(uUvs, uvs[indexC], vec2.exactEquals),
                getIndex(uNormals, normals[indexC], vec3.exactEquals)
            );

            // Then second
            sphere.indexes.push(
                getIndex(uVerticies, verticies[indexB], vec3.exactEquals),
                getIndex(uUvs, uvs[indexB], vec2.exactEquals),
                getIndex(uNormals, normals[indexB], vec3.exactEquals),

                getIndex(uVerticies, verticies[indexD], vec3.exactEquals),
                getIndex(uUvs, uvs[indexD], vec2.exactEquals),
                getIndex(uNormals, normals[indexD], vec3.exactEquals),

                getIndex(uVerticies, verticies[indexC], vec3.exactEquals),
                getIndex(uUvs, uvs[indexC], vec2.exactEquals),
                getIndex(uNormals, normals[indexC], vec3.exactEquals)
            );
        }
    }

    // Go through each unique array and record them in our structure
    for (let i = 0; i < uVerticies.length; i++) {
        sphere.verticies.push(...uVerticies[i]);
    }
    for (let i = 0; i < uNormals.length; i++) {
        sphere.normals.push(...uNormals[i]);
    }
    for (let i = 0; i < uUvs.length; i++) {
        sphere.uvs.push(...uUvs[i]);
    }

    // Switch to verticies/indicies format.
    const vertexMap: Record<string, number> = {};
    let nextIndex = 0;

    const finalVerticies: Array<number> = [
        // pos.x, pos.y, pos.z, uv.u, uv.v, normal.x, normal.y, normal.z
    ];
    const finalIndices: Array<number> = [];

    for (let i = 0; i < sphere.indexes.length; i += 3) {
        const iPosition = sphere.indexes[i];
        const iUv = sphere.indexes[i + 1];
        const iNormal = sphere.indexes[i + 2];

        const key = [iPosition, iUv, iNormal].join("/");
        let index = vertexMap[key];
        if (typeof index === "undefined") {
            vertexMap[key] = index = nextIndex;
            nextIndex += 1;

            finalVerticies.push(
                sphere.verticies[iPosition * 3 + 0],
                sphere.verticies[iPosition * 3 + 1],
                sphere.verticies[iPosition * 3 + 2],

                sphere.uvs[iUv * 2 + 0],
                sphere.uvs[iUv * 2 + 1],

                sphere.normals[iNormal * 3 + 0],
                sphere.normals[iNormal * 3 + 1],
                sphere.normals[iNormal * 3 + 2]
            );
        }

        finalIndices.push(index);
    }

    return {
        verticies: finalVerticies,
        indices: finalIndices
    };
}

export const Sphere = generateSphere(1, 16, 16);
