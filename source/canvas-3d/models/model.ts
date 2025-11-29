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

    constructor({ mesh, position, center, rotation, pivot, scale }: ModelProperties) {
        super();

        this.mesh = mesh;

        this.position = position ?? vec3.create();
        this.center = center ?? vec3.create();
        this.rotation = rotation ?? quat.create();
        this.pivot = pivot ?? vec3.create();
        this.scale = scale ?? vec3.fromValues(1, 1, 1);
    }

    draw(camera: Canvas3DCamera, _time: RefreshTime) {
        const { context: gl } = camera;

        const worldMatrix = mat4.create();
        mat4.translate(worldMatrix, worldMatrix, this.position);
        mat4.translate(worldMatrix, worldMatrix, this.pivot);
        mat4.translate(worldMatrix, worldMatrix, this.center);
        const rotationMatrix = mat4.fromQuat(mat4.create(), this.rotation);
        mat4.multiply(worldMatrix, worldMatrix, rotationMatrix);
        mat4.scale(worldMatrix, worldMatrix, this.scale);
        mat4.translate(worldMatrix, worldMatrix, vec3.negate(vec3.create(), this.center));
        mat4.translate(worldMatrix, worldMatrix, vec3.negate(vec3.create(), this.pivot));

        gl.uniformMatrix4fv(this.mesh.uniformLocations.modelMatrix, false, worldMatrix);

        // Applying should be done once per group of writes.
        // TODO: group similar meshes together, to write all at once without
        // switching.
        this.mesh.apply(camera);

        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.size);
    }
}
