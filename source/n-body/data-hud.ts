import GameObject from "source/core/game-object";
import Canvas2DCamera from "source/canvas-2d/cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";

export default class DataHud extends GameObject {
    draw(camera: Canvas2DCamera, _time: RefreshTime) {
        // HUDs should be drawn relative to the canvas.
        camera.context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
