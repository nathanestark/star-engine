import { GameObject, RefreshTime } from "source/core";
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
    private _mesh: Mesh;

    position: vec3;
    center: vec3;
    rotation: quat;
    pivot: vec3;
    scale: vec3;

    worldMatrix: mat4 = mat4.create();

    constructor({ mesh, position, center, rotation, pivot, scale }: ModelProperties) {
        super();

        this.classTags = ["model"];

        this._mesh = mesh;

        this.position = position ?? vec3.create();
        this.center = center ?? vec3.create();
        this.rotation = rotation ?? quat.create();
        this.pivot = pivot ?? vec3.create();
        this.scale = scale ?? vec3.fromValues(1, 1, 1);
    }

    get mesh() {
        return this._mesh;
    }

    draw(_camera: Canvas3DCamera, _time: RefreshTime) {
        mat4.identity(this.worldMatrix);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.position);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.pivot);
        mat4.translate(this.worldMatrix, this.worldMatrix, this.center);
        const rotationMatrix = mat4.fromQuat(mat4.create(), this.rotation);
        mat4.multiply(this.worldMatrix, this.worldMatrix, rotationMatrix);
        mat4.scale(this.worldMatrix, this.worldMatrix, this.scale);
        mat4.translate(this.worldMatrix, this.worldMatrix, vec3.negate(vec3.create(), this.center));
        mat4.translate(this.worldMatrix, this.worldMatrix, vec3.negate(vec3.create(), this.pivot));
    }
}
