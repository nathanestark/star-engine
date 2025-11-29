import { vec2, vec3 } from "gl-matrix";

function generateSphere(
    radius = 1,
    numLat = 32,
    numLong = 32
): {
    verticies: Array<number>;
    uvs: Array<number>;
    normals: Array<number>;
} {
    const verticies = [] as Array<vec3>;
    const normals = [] as Array<vec3>;
    const uvs = [] as Array<vec2>;
    const sphere = {
        // prettier-ignore
        verticies: [] as Array<number>,

        // prettier-ignore
        uvs: [] as Array<number>,

        // prettier-ignore
        normals: [] as Array<number>
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

    for (let lat = 0; lat < numLat; lat++) {
        for (let long = 0; long < numLong; long++) {
            const indexA = lat * (numLong + 1) + long;
            const indexB = (lat + 1) * (numLong + 1) + long;
            const indexC = indexA + 1;
            const indexD = indexB + 1;

            // Write first triangle,
            sphere.verticies.push(
                verticies[indexA][0],
                verticies[indexA][1],
                verticies[indexA][2],
                verticies[indexB][0],
                verticies[indexB][1],
                verticies[indexB][2],
                verticies[indexC][0],
                verticies[indexC][1],
                verticies[indexC][2]
            );
            sphere.normals.push(
                normals[indexA][0],
                normals[indexA][1],
                normals[indexA][2],
                normals[indexB][0],
                normals[indexB][1],
                normals[indexB][2],
                normals[indexC][0],
                normals[indexC][1],
                normals[indexC][2]
            );
            sphere.uvs.push(
                uvs[indexA][0],
                uvs[indexA][1],
                uvs[indexB][0],
                uvs[indexB][1],
                uvs[indexC][0],
                uvs[indexC][1]
            );
            // Then second
            sphere.verticies.push(
                verticies[indexB][0],
                verticies[indexB][1],
                verticies[indexB][2],
                verticies[indexD][0],
                verticies[indexD][1],
                verticies[indexD][2],
                verticies[indexC][0],
                verticies[indexC][1],
                verticies[indexC][2]
            );
            sphere.normals.push(
                normals[indexB][0],
                normals[indexB][1],
                normals[indexB][2],
                normals[indexD][0],
                normals[indexD][1],
                normals[indexD][2],
                normals[indexC][0],
                normals[indexC][1],
                normals[indexC][2]
            );
            sphere.uvs.push(
                uvs[indexB][0],
                uvs[indexB][1],
                uvs[indexD][0],
                uvs[indexD][1],
                uvs[indexC][0],
                uvs[indexC][1]
            );
        }
    }

    return sphere;
}

export const Sphere = generateSphere(1, 64, 64);
