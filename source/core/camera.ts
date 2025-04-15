import GameObject from "./game-object";
import { RefreshTime } from "./types";

export default class Camera extends GameObject {
    isDisabled: boolean;

    constructor() {
        super();
        this.classTags = ["camera"];
        this.isDisabled = false;
    }

    // Clears the display. First step to draw.
    clear() {}

    // Performs any transforms or calculations required to set up this camera's
    // view based on it's updated properties.
    // eslint-disable-next-line no-unused-vars
    calculateView(time: RefreshTime) {}

    // Saves the view state in a stack so that further modifications of the view can
    // be made, and the restored back.
    saveState() {}

    // Restores the last saved view state back to the current state.
    restoreState() {}

    // Requests that the specified object draws itself on the canvas.
    drawObject(obj: GameObject, time: RefreshTime) {
        obj.draw(this, time);
    }

    // Requests that the specified object debug draws itself on the canvas.
    debugDrawObject(obj: GameObject, time: RefreshTime) {
        obj.debugDraw(this, time);
    }

    // If your camera requires double buffering, simply implement 'drawDoubleBuffer' to
    // perform the final draw from the back-buffer to the display buffer.
    drawDoubleBuffer?(): void;
}
