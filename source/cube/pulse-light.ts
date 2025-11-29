import { vec3 } from "gl-matrix";
import { AmbientLight } from "source/canvas-3d";
import { RefreshTime } from "source/core";

export class PulseLight extends AmbientLight {
    constructor() {
        super({ color: vec3.create(), emitAutoUpdateEvents: false });
    }
    update(time: RefreshTime): void {
        const val = (1 + Math.sin(time.curTime / 300)) / 4;
        this.color = vec3.fromValues(val, val, val);
        this.emitUpdated();
    }
}
