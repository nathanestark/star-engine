import { Camera, GameObject, RefreshTime } from "source/core";
import { Mesh } from "../meshes/mesh";
import { mat4, quat, vec3 } from "gl-matrix";
import Canvas3DCamera from "../cameras/canvas-3d-camera";

export interface ModelProperties {
    mesh: Mesh;
    position?: vec3;
    center?: vec3;
    rotation?: quat;
    pivot?: vec3;
    scale?: vec3;
}

export class Model extends GameObject {
    private mesh: Mesh;

    position: vec3;
    center: vec3;
    rotation: quat;
    pivot: vec3;
    scale: vec3;

    worldMatrix: mat4 = mat4.create();

    constructor({ mesh, position, center, rotation, pivot, scale }: ModelProperties) {
        super();

        this.classTags = ["model"];

        this.mesh = mesh;

        this.position = position ?? vec3.create();
        this.center = center ?? vec3.create();
        this.rotation = rotation ?? quat.create();
        this.pivot = pivot ?? vec3.create();
        this.scale = scale ?? vec3.fromValues(1, 1, 1);
    }

    get meshId() {
        return this.mesh.id;
    }

    get meshSize() {
        return this.mesh.size;
    }

    get program() {
        return this.mesh.program;
    }

    get shader() {
        return this.mesh.shader;
    }

    get vao() {
        return this.mesh.vao;
    }

    init(gl: WebGL2RenderingContext) {}

    apply(camera: Canvas3DCamera): void {
        this.mesh.apply(camera);
    }

    managerDraw(camera: Canvas3DCamera, _time: RefreshTime, instanceIndex: number) {
        const { context: gl } = camera;

        mat4.identity(this.worldMatrix);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.position);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.pivot);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.center);
        const rotationMatrix = mat4.fromQuat(mat4.create(), this.rotation);
        mat4.multiply(this.worldMatrix, this.worldMatrix, rotationMatrix);
        mat4.scale(this.worldMatrix, this.worldMatrix, this.scale);
        mat4.translate(this.worldMatrix, this.worldMatrix, vec3.negate(vec3.create(), this.center));
        mat4.translate(this.worldMatrix, this.worldMatrix, vec3.negate(vec3.create(), this.pivot));

        // gl.uniformMatrix4fv(this.mesh.uniformLocations.modelMatrix, false, worldMatrix);

        // gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, instanceIndex * 64, this.worldMatrix as Float32Array);

        // // Applying should be done once per group of writes.
        // // TODO: group similar meshes together, to write all at once without
        // // switching.
        // this.mesh.apply(camera);

        // gl.drawArraysInstanced(gl.TRIANGLES, 0, this.mesh.size, 1);
    }
}
