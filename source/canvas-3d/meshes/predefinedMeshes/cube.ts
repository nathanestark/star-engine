function generateCube(): {
    verticies: Array<number>;
    indices: Array<number>;
} {
    // prettier-ignore
    const positions = [
        -1.0, -1.0,  1.0, // 0
        1.0, -1.0,  1.0, // 1
        1.0,  1.0,  1.0, // 2
        -1.0,  1.0,  1.0, // 3
        1.0, -1.0, -1.0, // 4
        -1.0, -1.0, -1.0, // 5
        -1.0,  1.0, -1.0, // 6
        1.0,  1.0, -1.0, // 7
    ];

    // prettier-ignore
    const uvs = [
        0.0, 0.25,  // 0
        0.25, 0.25,  // 1
        0.25, 0.0,  // 2
        0.0, 0.0,  // 3
        0.5, 0.25,  // 4
        0.5, 0.0,  // 5
        0.75, 0.25,  // 6
        0.75, 0.0,  // 7
        1.0, 0.25,  // 8
        1.0, 0.0,  // 9
        0.0, 0.5,  // 10
        0.25, 0.5,  // 11
        0.5, 0.5,  // 12
    ];

    // prettier-ignore
    const normals = [
        0.0, 0.0, 1.0,  // 0
        0.0, 0.0, -1.0,  // 1
        0.0, 1.0, 0.0,  // 2
        0.0, -1.0, 0.0,  // 3
        1.0, 0.0, 0.0,  // 4
        -1.0, 0.0, 0.0,  // 5
    ];

    // prettier-ignore
    const indexes = [
        // position, uv, normal
        // Front face (z = +1)
        0, 0, 0,
        1, 1, 0,
        2, 2, 0,

        0, 0, 0,
        2, 2, 0,
        3, 3, 0,

        // Back face (z = -1)
        4, 1, 1,
        5, 4, 1,
        6, 5, 1,

        4, 1, 1,
        6, 5, 1,
        7, 2, 1,

        // Top face (y = +1)
        3, 4, 2,
        2, 6, 2,
        7, 7, 2,

        3, 4, 2,
        7, 7, 2,
        6, 5, 2,

        // Bottom face (y = -1)
        5, 6, 3,
        4, 8, 3,
        1, 9, 3,

        5, 6, 3,
        1, 9, 3,
        0, 7, 3,

        // Right face (x = +1)
        1, 10, 4,
        4, 11, 4,
        7, 1, 4,

        1, 10, 4,
        7, 1, 4,
        2, 0, 4,

        // Left face (x = -1)
        5, 11, 5,
        0, 12, 5,
        3, 4, 5,

        5, 11, 5,
        3, 4, 5,
        6, 1, 5,
    ];

    const vertexMap: Record<string, number> = {};
    let nextIndex = 0;

    const verticies: Array<number> = [
        // pos.x, pos.y, pos.z, uv.u, uv.v, normal.x, normal.y, normal.z
    ];
    const indices: Array<number> = [];

    for (let i = 0; i < indexes.length; i += 3) {
        const iPosition = indexes[i];
        const iUv = indexes[i + 1];
        const iNormal = indexes[i + 2];

        const key = [iPosition, iUv, iNormal].join("/");
        let index = vertexMap[key];
        if (typeof index === "undefined") {
            vertexMap[key] = index = nextIndex;
            nextIndex += 1;

            verticies.push(
                positions[iPosition * 3 + 0],
                positions[iPosition * 3 + 1],
                positions[iPosition * 3 + 2],

                uvs[iUv * 2 + 0],
                uvs[iUv * 2 + 1],

                normals[iNormal * 3 + 0],
                normals[iNormal * 3 + 1],
                normals[iNormal * 3 + 2]
            );
        }

        indices.push(index);
    }

    return {
        verticies,
        indices
    };
}

export const Cube = generateCube();
