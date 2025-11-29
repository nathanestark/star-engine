type ArrayTypes =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

export interface BasicBuffers {
    positions: WebGLBuffer;
    normals: WebGLBuffer;
    uvs: WebGLBuffer;
}

export function initializeBasicBuffers(
    gl: WebGL2RenderingContext,
    positions: Float32Array | Array<number>,
    normals: Float32Array | Array<number>,
    uvs: Float32Array | Array<number>
): BasicBuffers {
    if (
        !positions ||
        !(positions instanceof Array || positions instanceof Float32Array) ||
        positions.length == 0
    ) {
        throw new Error("Invalid 'positions'");
    }
    if (
        !normals ||
        !(normals instanceof Array || normals instanceof Float32Array) ||
        normals.length == 0
    ) {
        throw new Error("Invalid 'indices'");
    }
    if (!uvs || !(uvs instanceof Array || uvs instanceof Float32Array) || uvs.length == 0) {
        throw new Error("Invalid 'uvs'");
    }

    if (!(positions instanceof Float32Array)) positions = new Float32Array(positions);
    if (!(normals instanceof Float32Array)) normals = new Float32Array(normals);
    if (!(uvs instanceof Float32Array)) uvs = new Float32Array(uvs);

    const positionsBuffer = initializeBuffer(
        Float32Array,
        gl,
        gl.ARRAY_BUFFER,
        positions,
        "positions"
    );
    const normalsBuffer = initializeBuffer(Float32Array, gl, gl.ARRAY_BUFFER, normals, "normals");

    const uvsBuffer = initializeBuffer(Float32Array, gl, gl.ARRAY_BUFFER, uvs, "uvs");
    return {
        positions: positionsBuffer,
        normals: normalsBuffer,
        uvs: uvsBuffer
    };
}

export function initializeBuffer<T_Array extends ArrayTypes>(
    ArrayType: { new (data: number[]): T_Array },
    gl: WebGL2RenderingContext,
    bufferType: 34962 | 34963,
    content: T_Array | Array<number>,
    name?: string
) {
    if (
        !content ||
        !(content instanceof Array || content instanceof ArrayType) ||
        content.length == 0
    ) {
        throw new Error(`Invalid '${name || "content"}'`);
    }

    if (content instanceof Array) content = new ArrayType(content);

    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, content, gl.STATIC_DRAW);

    return buffer;
}
