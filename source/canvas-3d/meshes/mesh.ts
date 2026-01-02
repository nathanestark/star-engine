import { GameObject } from "source/core";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { Material } from "../materials";

import { Cube } from "./predefinedMeshes/cube";
import { Sphere } from "./predefinedMeshes/sphere";

function isValidArray(array: Float32Array | Uint16Array | Array<number>): boolean {
    return (
        array &&
        (array instanceof Array || array instanceof Float32Array || array instanceof Uint16Array) &&
        array.length > 0
    );
}

export interface MeshProperties {
    verticies: Float32Array | Array<number>;
    indices: Uint16Array | Array<number>;
    material: Material;
}

export class Mesh extends GameObject {
    private verticies: Float32Array;
    private indices: Uint16Array;
    private material: Material;

    private verticiesBuffer: WebGLBuffer;
    private indicesBuffer: WebGLBuffer;

    constructor({ verticies, indices, material }: MeshProperties) {
        super();

        this.classTags = ["mesh"];

        if (!isValidArray(verticies)) throw new Error("Invalid 'verticies'");
        if (!isValidArray(indices)) throw new Error("Invalid 'indices'");

        this.verticies =
            verticies instanceof Float32Array ? verticies : new Float32Array(verticies);
        this.indices = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
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
        return this.indices.length;
    }

    get program() {
        return this.material.program;
    }

    get shader() {
        return this.material.shader;
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
        // Model manager is managing the VAO.

        if (!this.verticiesBuffer) {
            this.verticiesBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.verticiesBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.verticies, gl.STATIC_DRAW);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.verticiesBuffer);
        }

        if (!this.indicesBuffer) {
            this.indicesBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        }

        gl.vertexAttribPointer(this.attribLocations.vertexPosition, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(this.attribLocations.vertexPosition);

        gl.vertexAttribPointer(this.attribLocations.uv, 2, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(this.attribLocations.uv);

        gl.vertexAttribPointer(this.attribLocations.vertexNormal, 3, gl.FLOAT, false, 32, 20);
        gl.enableVertexAttribArray(this.attribLocations.vertexNormal);

        // Unbind buffer when we're all done.
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    apply(camera: Canvas3DCamera): void {
        this.material.apply(camera);
    }
}
