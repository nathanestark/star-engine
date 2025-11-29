import { vec3 } from "gl-matrix";
import { DirectionalLight } from "source/canvas-3d";
import { RefreshTime } from "source/core";

export class SpinLight extends DirectionalLight {
    constructor() {
        super({
            color: vec3.fromValues(0.6, 0.1, 0.1),
            direction: vec3.create(),
            emitAutoUpdateEvents: false
        });
    }
    update(time: RefreshTime): void {
        const x = Math.sin(time.curTime / 500);
        const z = Math.cos(time.curTime / 500);
        vec3.normalize(this.direction, vec3.fromValues(x, 0, z));
        this.emitUpdated();
    }
}
