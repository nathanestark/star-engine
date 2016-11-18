export default class Camera {
    constructor() {
        this.classTags = ["camera"];

        this.isDisabled = false;
    }

    // Clears the display. First step to draw.
    clear() {}

    // Performs any transforms or calculations required to set up this camera's
    // view based on it's updated properties.
    calculateView(tDelta) {}

    // Saves the view state in a stack so that further modifications of the view can
    // be made, and the restored back.
    saveState() {}

    // Restores the last saved view state back to the current state.
    restoreState() {}

    // Requests that the specified object draws itself on the canvas.
    drawObject(obj, tDelta) {
        obj.draw(tDelta, this);
    }
    
    // Requests that the specified object debug draws itself on the canvas.
    debugDrawObject(obj, tDelta) {
        obj.debugDraw(tDelta, this);
    }

    // If your camera requires double buffering, simply implement 'drawDoubleBuffer' to 
    // perform the final draw from the back-buffer to the display buffer.
    /*
    drawDoubleBuffer() {
    }*/
}