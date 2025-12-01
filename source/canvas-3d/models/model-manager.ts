import { GameObject, RefreshTime } from "source/core";
import { Model } from "./model";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { Mesh } from "../meshes";

interface InstancedGroup {
    id: string;
    models: Array<Model>;
    mesh: Mesh;
    vao?: WebGLVertexArrayObject;
    instanceBuffer?: WebGLBuffer;
}

export class ModelManager extends GameObject {
    private renderGroups: Map<string, InstancedGroup>;
    private maxInstances: number;

    constructor(maxInstances: number = 100) {
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
    }

    private getRenderGroupId(mesh: Mesh) {
        return `${mesh.id}_${mesh.shader.id}`;
    }

    private addModel(model: Model) {
        const groupId = this.getRenderGroupId(model.mesh);

        let entry: InstancedGroup = this.renderGroups.get(groupId);
        if (!entry) {
            entry = {
                id: groupId,
                mesh: model.mesh,
                models: []
            };
        }

        entry.models.push(model);
        // Clear VAO and instance buffer to force them to recompute.
        entry.vao = null;
        entry.instanceBuffer = null;

        this.renderGroups.set(groupId, entry);
    }

    private onGameObjectRemoved(gameObject: GameObject) {
        // If it isn't a model, we don't care.
        if (!gameObject.classTags?.includes("model")) return;

        const model = gameObject as Model;

        this.removeModel(model);
    }

    private removeModel(model: Model) {
        const groupId = this.getRenderGroupId(model.mesh);

        let entry = this.renderGroups.get(groupId);
        if (!entry) return;

        entry.models = entry.models.filter((existingModel) => existingModel.id != model.id);
        // Clear VAO and instance buffer to force them to recompute.
        entry.vao = null;
        entry.instanceBuffer = null;

        if (!entry.models.length) {
            this.renderGroups.delete(groupId);
        }
    }

    draw(camera: Canvas3DCamera, _time: RefreshTime): void {
        const { context: gl } = camera;

        this.renderGroups.forEach((group) => {
            if (!group.models.length) return;

            // Apply this groups program and textures.
            group.mesh.apply(camera);

            // Decide if we need to initialize the group
            if (!group.vao) {
                group.vao = gl.createVertexArray();
                gl.bindVertexArray(group.vao);

                group.mesh.init(camera);

                if (!group.instanceBuffer) {
                    group.instanceBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, group.instanceBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, 64 * group.models.length, gl.DYNAMIC_DRAW);
                } else {
                    gl.bindBuffer(gl.ARRAY_BUFFER, group.instanceBuffer);
                }

                const loc = group.mesh.shader.attribLocations.modelMatrix;
                for (let i = 0; i < 4; i++) {
                    const l = loc + i;
                    gl.enableVertexAttribArray(l);
                    gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 64, i * 16);
                    gl.vertexAttribDivisor(l, 1);
                }
            } else {
                // If not, bind vao and buffer
                gl.bindVertexArray(group.vao);
                gl.bindBuffer(gl.ARRAY_BUFFER, group.instanceBuffer);
            }

            // Buffer world data per model
            group.models.forEach((model, i) => {
                gl.bufferSubData(gl.ARRAY_BUFFER, i * 64, model.worldMatrix as Float32Array);
            });

            // Draw them all
            gl.drawArraysInstanced(gl.TRIANGLES, 0, group.mesh.size / 3, group.models.length);
        });

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
