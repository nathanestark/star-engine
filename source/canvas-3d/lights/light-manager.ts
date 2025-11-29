import { vec3 } from "gl-matrix";
import { Camera, GameObject, RefreshTime } from "source/core";
import { AmbientLight, DirectionalLight, PointLight } from "./lights";
import { Light } from "./light";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { UboBindPoint } from "../ubo-bind-point-manager";

export interface LightManagerPropeties {
    bindPoint: UboBindPoint;
}

export class LightManager extends GameObject {
    private bindPoint: UboBindPoint;

    private ambientLights: Array<AmbientLight>;
    private directionalLights: Array<DirectionalLight>;
    private pointLights: Array<PointLight>;

    private ambientLight = vec3.create();

    private ambientLightChanged = true;
    private directionalLightChanged = true;
    private pointLightChanged = true;

    private uboBuffer: WebGLBuffer = null;

    constructor({ bindPoint }: LightManagerPropeties) {
        super();

        this.bindPoint = bindPoint;
    }

    gameObjectAdded(): void {
        this.ambientLights = this.game.filter({
            op: "exclusive",
            tags: ["light", "ambient"]
        }) as Array<AmbientLight>;

        this.ambientLights.forEach(({ color }) => {
            vec3.add(this.ambientLight, this.ambientLight, color);
        });

        // Then directional lights
        this.directionalLights = this.game.filter({
            op: "exclusive",
            tags: ["light", "directional"]
        }) as Array<DirectionalLight>;

        // Then point lights
        this.pointLights = this.game.filter({
            op: "exclusive",
            tags: ["light", "point"]
        }) as Array<PointLight>;

        // Listen for any other lights being added
        this.game.on("gameObjectAdded", this.onGameObjectAdded.bind(this));
        this.game.on("gameObjectRemoved", this.onGameObjectRemoved.bind(this));
    }

    gameObjectRemoved(): void {
        // Stop listening for lights being added
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

        // If it isn't a light, we don't care.
        if (!gameObject.classTags?.includes("light")) return;

        this.addingLight(gameObject as Light);
    }

    private onGameObjectRemoved(gameObject: GameObject) {
        // If it isn't a light, we don't care.
        if (!gameObject.classTags?.includes("light")) return;

        this.removingLight(gameObject as Light);
    }

    protected addingLight(light: Light) {
        if (light.classTags?.includes("ambient")) this.addingAmbientLight(light as AmbientLight);
        if (light.classTags?.includes("directional"))
            this.addingDirectionalLight(light as DirectionalLight);
        if (light.classTags?.includes("point")) this.addingPointLight(light as PointLight);
    }

    protected addingAmbientLight(light: AmbientLight) {
        this.ambientLights.push(light);
        // Recompute
        vec3.add(this.ambientLight, this.ambientLight, light.color);
        this.ambientLightChanged = true;

        light.on("updated", this.updatingAmbientLight.bind(this));
    }

    protected updatingAmbientLight() {
        vec3.zero(this.ambientLight);
        this.ambientLights.forEach(({ color }) => {
            vec3.add(this.ambientLight, this.ambientLight, color);
        });
        this.ambientLightChanged = true;
    }

    protected addingDirectionalLight(light: DirectionalLight) {
        this.directionalLights.push(light);
        this.directionalLightChanged = true;

        light.on("updated", this.updatingDirectionalLight.bind(this));
    }

    protected updatingDirectionalLight() {
        this.directionalLightChanged = true;
    }

    protected addingPointLight(light: PointLight) {
        this.pointLights.push(light);
        this.pointLightChanged = true;

        light.on("updated", this.updatingPointLight.bind(this));
    }

    protected updatingPointLight() {
        this.pointLightChanged = true;
    }

    protected removingLight(light: Light) {
        if (light.classTags?.includes("ambient")) this.addingAmbientLight(light as AmbientLight);
        if (light.classTags?.includes("directional"))
            this.addingDirectionalLight(light as DirectionalLight);
        if (light.classTags?.includes("point")) this.addingPointLight(light as PointLight);
    }

    protected removingAmbientLight(light: AmbientLight) {
        this.ambientLights = this.ambientLights.filter((aLight) => aLight.id != light.id);

        // Recompute
        vec3.subtract(this.ambientLight, this.ambientLight, light.color);
        this.ambientLightChanged = true;

        light.off("updated", this.updatingAmbientLight.bind(this));
    }

    protected removingDirectionalLight(light: DirectionalLight) {
        this.directionalLights = this.directionalLights.filter((dLight) => dLight.id != light.id);
        this.directionalLightChanged = true;

        light.off("updated", this.updatingDirectionalLight.bind(this));
    }

    protected removingPointLight(light: PointLight) {
        this.pointLights = this.pointLights.filter((pLight) => pLight.id != light.id);
        this.pointLightChanged = true;

        light.off("updated", this.updatingPointLight.bind(this));
    }

    init({ context: gl }: Canvas3DCamera) {
        // Create Uniform Buffer to store our data
        this.uboBuffer = gl.createBuffer();

        // Bind it to tell WebGL we are working on this buffer
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);

        // Allocate memory for our buffer equal to the size of our Uniform Block
        // We use dynamic draw because we expect to respecify the contents of the buffer frequently
        gl.bufferData(gl.UNIFORM_BUFFER, this.bindPoint.size, gl.DYNAMIC_DRAW);

        // Bind the buffer to a binding point
        // Think of it as storing the buffer into a special UBO ArrayList
        // The second argument is the index you want to store your Uniform Buffer in
        // Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.bindPoint.index, this.uboBuffer);

        // Unbind buffer when we're done using it for now
        // Good practice to avoid unintentionally working on it
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    draw(camera: Canvas3DCamera, _time: RefreshTime): void {
        const { context: gl } = camera;

        if (!this.uboBuffer) return;

        let bufferSet = false;

        if (this.ambientLightChanged) {
            // We've had ambient changes, so update our ambient value.
            if (!bufferSet) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);
                bufferSet = true;
            }

            gl.bufferSubData(
                gl.UNIFORM_BUFFER,
                this.bindPoint.variables.ambientLight.offset,
                new Float32Array(this.ambientLight)
            );
            this.ambientLightChanged = false;
        }

        if (this.directionalLightChanged) {
            if (!bufferSet) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);
                bufferSet = true;
            }

            // Update count
            gl.bufferSubData(
                gl.UNIFORM_BUFFER,
                this.bindPoint.variables.directionalLightCount.offset,
                new Int32Array([this.directionalLights.length])
            );

            const faDirections = new Float32Array(this.directionalLights.length * 3);
            const faColor = new Float32Array(this.directionalLights.length * 3);
            this.directionalLights.forEach((light, i) => {
                faDirections.set(light.direction, i * 3);
                faColor.set(light.color, i * 3);
            });

            // Update direction
            gl.bufferSubData(
                gl.UNIFORM_BUFFER,
                this.bindPoint.variables.directionalLightDirections.offset,
                faDirections
            );

            // Update color
            gl.bufferSubData(
                gl.UNIFORM_BUFFER,
                this.bindPoint.variables.directionalLightColors.offset,
                faColor
            );
            this.directionalLightChanged = false;
        }

        if (this.pointLightChanged) {
            if (!bufferSet) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);
                bufferSet = true;
            }
            // TODO: Implement point lights.
            this.pointLightChanged = false;
        }

        if (bufferSet) {
            // Unbind for good measure.
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
    }
}
