import { vec3 } from "gl-matrix";
import { GameObject, RefreshTime } from "source/core";
import { Model } from "./model";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { UboBindPoint } from "../ubo-bind-point-manager";
import { Mesh } from "../meshes";

export class ModelManager extends GameObject {
    private renderGroups: Map<string, Array<Model>>;

    private maxInstances: number;

    private instanceBuffer: WebGLBuffer;

    private modelChanged = true;

    constructor(maxInstances: number = 10000) {
        super();

        this.classTags = ["modelManager"];

        this.maxInstances = maxInstances;
    }

    gameObjectAdded(): void {
        const allModels = this.game.filter("model") as Array<Model>;
        this.renderGroups = new Map();
        allModels.forEach((model) => this.addModel(model));

        // Listen for any other models being added
        this.game.on("gameObjectAdded", this.onGameObjectAdded.bind(this));
        this.game.on("gameObjectRemoved", this.onGameObjectRemoved.bind(this));
    }

    gameObjectRemoved(): void {
        // Stop listening for models being added
        this.game.off("gameObjectAdded", this.onGameObjectAdded.bind(this));
        this.game.off("gameObjectRemoved", this.onGameObjectRemoved.bind(this));
    }

    private onGameObjectAdded(
        gameObject: GameObject,
        oldParent: GameObject,
        _newParent: GameObject
    ) {
        // If it was a move, we don't care.
        if (oldParent) return;

        // If it isn't a model, we don't care.
        if (!gameObject.classTags?.includes("model")) return;

        this.addModel(gameObject as Model);

        // Recompute
        this.modelChanged = true;
    }

    private getRenderGroupId(model: Model) {
        return `${model.meshId}_${model.shader.id}`;
    }

    private addModel(model: Model) {
        const groupId = this.getRenderGroupId(model);

        const entry = this.renderGroups.get(groupId) || [];

        entry.push(model);

        this.renderGroups.set(groupId, entry);
    }

    private onGameObjectRemoved(gameObject: GameObject) {
        // If it isn't a model, we don't care.
        if (!gameObject.classTags?.includes("model")) return;

        const model = gameObject as Model;

        this.removeModel(model);

        // Recompute.
        this.modelChanged = true;
    }

    private removeModel(model: Model) {
        const groupId = this.getRenderGroupId(model);

        let entry = this.renderGroups.get(groupId);
        if (!entry) return;

        entry = entry.filter((existingModel) => existingModel.id != model.id);

        if (entry.length) {
            this.renderGroups.set(groupId, entry);
        } else {
            this.renderGroups.delete(groupId);
        }
    }

    // init({ context: gl }: Canvas3DCamera, group: Array<Model>) {
    //     if (!group.length) return;

    //     // if (!this.instanceBuffer) {
    //     //     this.instanceBuffer = gl.createBuffer();
    //     //     gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    //     //     gl.bufferData(gl.ARRAY_BUFFER, 64 * this.maxInstances, gl.DYNAMIC_DRAW);
    //     // } else {
    //     //     gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    //     // }

    //     // gl.bindVertexArray(group[0].vao);
    //     // const loc = group[0].shader.attribLocations.modelMatrix;

    //     // for (let i = 0; i > 4; i++) {
    //     //     const l = loc + i;
    //     //     gl.enableVertexAttribArray(l);
    //     //     gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 64, i * 16);
    //     //     gl.vertexAttribDivisor(l, group[0].meshSize); // 1?
    //     // }

    //     // Replace each model's worldMatrix with a segment of the
    //     // instanceData array.
    //     group.forEach((model, i) => {
    //         // const offset = i * 16;
    //         // model.worldMatrix = this.instanceData.subarray(offset, offset + 16);
    //         model.instanceIndex = i;
    //     });
    // }

    draw(camera: Canvas3DCamera, time: RefreshTime): void {
        const { context: gl } = camera;

        let offset = 0;
        this.renderGroups.forEach((group) => {
            if (!group.length) return;

            // Apply this groups program, textures, vao.
            group[0].apply(camera);

            // this.init(camera, group);
            // If we need to reinitialize, do so.
            // if (this.modelChanged) {
            // this.init(camera);
            //     this.modelChanged = false;
            // } else {
            //     gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
            // }

            group.forEach((model, i) => {
                // Anything to do here? Ideally each model is writing
                // its worldMatrix directly to the instanceData array.
                model.managerDraw(camera, time, i);
            });

            gl.drawArraysInstanced(gl.TRIANGLES, 0, group[0].meshSize, group.length);
            offset += group[0].meshSize;
        });

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
