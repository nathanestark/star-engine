import { vec2 } from "gl-matrix";
import Canvas2DCamera, { Canvas2DCameraProperties } from "../canvas-2d/cameras/canvas-2d-camera";
import Body from "./body";

export interface FollowCameraProperties extends Canvas2DCameraProperties {
    target?: Body;
    offset?: vec2;
    view?: "x" | "y" | "z";
}

export default class FollowCamera extends Canvas2DCamera {
    target: Body | null;
    offset?: vec2;
    view: "x" | "y" | "z";
    minShowRadius: number;
    objectScale: number;

    constructor(
        canvas: HTMLCanvasElement,
        { view, target, offset, ...superProps }: FollowCameraProperties
    ) {
        super(canvas, superProps);

        this.minShowRadius = 0;
        this.objectScale = 1;

        if (view) this.view = view;
        else this.view = "x";

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
                    vec2.copy(this.position, [this.target.position[0], this.target.position[2]]);
                } else if (this.view == "z") {
                    vec2.copy(this.position, [-this.target.position[1], this.target.position[2]]);
                }
                vec2.add(this.position, this.position, this.offset);
            }
        }
    }
}
