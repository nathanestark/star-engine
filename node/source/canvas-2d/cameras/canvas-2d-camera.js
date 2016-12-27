import Camera from '../../core/camera';

export default class Canvas2DCamera extends Camera {
    constructor(canvas) {
        super();

        if (!canvas)
            throw "Camera must have a canvas to draw to!";

        // this will get reset when _fitToContainer is called.
        this.size = {width: 0, height: 0 };
        this.clearColor = "black";

        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');

        this.drawCanvas = document.createElement('canvas');
        this.drawContext = this.canvas.getContext('2d');

        // Set to parent now.
        this._fitToContainer();
    }

    _fitToContainer() {
        if (this.canvas.width != this.canvas.offsetWidth
            || this.canvas.height != this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;

            this.drawCanvas.width = this.canvas.width;
            this.drawCanvas.height = this.canvas.height;

            this.size = { width: this.canvas.width, height: this.canvas.height };
        }
    }

    // Clears the display. First step to draw.
    clear() {
        this.drawContext.save();
        this.drawContext.setTransform(1, 0, 0, 1, 0, 0);
        this.drawContext.fillStyle = this.clearColor;
        this.drawContext.fillRect(0, 0, this.size.width, this.size.height);
        this.drawContext.restore();
    }

    // Performs any transforms or calculations required to set up this camera's
    // view based on it's updated properties.
    calculateView(time) {
        this._fitToContainer();
    }

    // Saves the view state in a stack so that further modifications of the view can
    // be made, and the restored back.
    saveState() {
        this.drawContext.save();
    }

    // Restores the last saved view state back to the current state.
    restoreState() {
        this.drawContext.restore();
    }

    // Requests that the specified object draws itself on the canvas.
    drawObject(obj, time) {
        obj.draw(time, this, this.drawContext);
    }

    // Requests that the specified object debug draws itself on the canvas.
    debugDrawObject(obj, time) {
        obj.debugDraw(time, this, this.drawContext);
    }

    // Draws anything in the back buffer to the display buffer.    
    drawDoubleBuffer() {
        this.context.drawImage(this.drawCanvas, 0, 0);
    }
} 