import Canvas2DCamera, { Canvas2DCameraProperties } from "./canvas-2d-camera";
import { vec2 } from "gl-matrix";
import { GameObject2D } from "../types";

export interface FollowCameraProperties extends Canvas2DCameraProperties {
    target?: GameObject2D;
    offset?: vec2;
}

export default class FollowCamera extends Canvas2DCamera {
    target?: GameObject2D;
    offset?: vec2;
    view?: "x" | "y";

    constructor(
        canvas: HTMLCanvasElement,
        { target, offset, ...superProps }: FollowCameraProperties = {}
    ) {
        super(canvas, superProps);

        if (target) this.target = target;
        else this.target = null;

        if (offset) this.offset = offset;
        else this.offset = vec2.fromValues(0, 0);
    }

    update() {
        // Set our position to our target's position
        if (this.target) {
            if (this.target.position) {
                if (this.view == "x") {
                    vec2.copy(this.position, [this.target.position[0], this.target.position[1]]);
                } else if (this.view == "y") {
                    vec2.copy(this.position, [this.target.position[1], this.target.position[0]]);
                } else {
                    vec2.copy(this.position, this.target.position);
                }
                vec2.add(this.position, this.position, this.offset);
            }
        }
    }
}
