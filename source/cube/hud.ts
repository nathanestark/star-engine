import GameObject from "source/core/game-object";
import Canvas3DCamera from "source/canvas-3d/cameras/canvas-3d-camera";
import { RefreshTime } from "source/core/types";

export default class Hud extends GameObject {
    constructor() {
        super();
        this.classTags = ["world"];
    }

    draw(camera: Canvas3DCamera, _time: RefreshTime) {
        // HUDs should be drawn relative to the canvas.
        // camera.context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
