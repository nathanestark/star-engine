import GameObject from "source/core/game-object";
import Canvas2DCamera from "source/canvas-2d/cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";

export default class CenteredHud extends GameObject {
    draw(camera: Canvas2DCamera, _time: RefreshTime) {
        // Centered HUD items should be drawn relative
        // to the canvas, but in the center.
        camera.context.translate(camera.size.width / 2, camera.size.height / 2);
    }
}
