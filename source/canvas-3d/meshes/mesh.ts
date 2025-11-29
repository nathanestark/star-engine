import { Camera, GameObject, RefreshTime } from "source/core";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { Material } from "../materials";
import { mat4, quat, vec3 } from "gl-matrix";

import { Cube } from "./predefinedMeshes/cube";
import { Sphere } from "./predefinedMeshes/sphere";

function isValidArray(array: Float32Array | Array<number>): boolean {
    return array && (array instanceof Array || array instanceof Float32Array) && array.length > 0;
}

export interface MeshProperties {
    verticies: Float32Array | Array<number>;
    normals: Float32Array | Array<number>;
    uvs: Float32Array | Array<number>;
    material: Material;
}

export class Mesh extends GameObject {
    private verticies: Float32Array;
    private normals: Float32Array;
    private uvs: Float32Array;
    private material: Material;

    private verticiesBuffer: WebGLBuffer;
    private normalsBuffer: WebGLBuffer;
    private uvsBuffer: WebGLBuffer;

    constructor({ verticies, normals, uvs, material }: MeshProperties) {
        super();

        if (!isValidArray(verticies)) throw new Error("Invalid 'verticies'");
        if (!isValidArray(normals)) throw new Error("Invalid 'normals'");
        if (!isValidArray(uvs)) throw new Error("Invalid 'uvs'");

        this.verticies =
            verticies instanceof Float32Array ? verticies : new Float32Array(verticies);
        this.normals = normals instanceof Float32Array ? normals : new Float32Array(normals);
        this.uvs = uvs instanceof Float32Array ? uvs : new Float32Array(uvs);
        this.material = material;
    }

    static createCube(material: Material) {
        return new Mesh({
            ...Cube,
            material: material
        });
    }

    static createSphere(material: Material) {
        return new Mesh({
            ...Sphere,
            material: material
        });
    }

    get size() {
        return this.verticies.length;
    }

    get program() {
        return this.material.program;
    }

    get attribLocations() {
        return this.material.attribLocations;
    }

    get uniformLocations() {
        return this.material.uniformLocations;
    }

    get uniformBlocks() {
        return this.material.uniformBlocks;
    }
    init({ context: gl }: Canvas3DCamera) {
        this.verticiesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticiesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.verticies, gl.STATIC_DRAW);

        this.normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        this.uvsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

        // Unbind buffer when we're all done.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    apply(camera: Canvas3DCamera): void {
        const { context: gl } = camera;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticiesBuffer);
        gl.vertexAttribPointer(this.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.vertexAttribPointer(this.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.vertexNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
        gl.vertexAttribPointer(this.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.uv);

        this.material.apply(camera);
    }
}
