import { vec3 } from "gl-matrix";
import { AmbientLight, DirectionalLight } from "source/canvas-3d";

export class SpinLight extends DirectionalLight {
    private time = 0;
    constructor() {
        super({
            color: vec3.fromValues(0.6, 0.1, 0.1),
            direction: vec3.create(),
            emitAutoUpdateEvents: false
        });
    }
    update(tDelta: number): void {
        this.time += tDelta;
        const x = Math.sin(this.time / 5);
        const z = Math.cos(this.time / 5);
        vec3.normalize(this.direction, vec3.fromValues(x, 0, z));
        this.emitUpdated();
    }
}
