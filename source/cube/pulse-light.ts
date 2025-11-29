import { vec3 } from "gl-matrix";
import { AmbientLight } from "source/canvas-3d";

export class PulseLight extends AmbientLight {
    private time = 0;
    constructor() {
        super({ color: vec3.create(), emitAutoUpdateEvents: false });
    }
    update(tDelta: number): void {
        this.time += tDelta;
        const val = (1 + Math.sin(this.time / 3)) / 4;
        this.color = vec3.fromValues(val, val, val);
        this.emitUpdated();
    }
}
