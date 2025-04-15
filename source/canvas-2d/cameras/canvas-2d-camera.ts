import GameObject from "source/core/game-object";
import Camera from "../../core/camera";
import { Size } from "../types";
import { RefreshTime } from "source/core/types";
import { vec2 } from "gl-matrix";

export interface Canvas2DCameraProperties {
    position?: vec2;
    rotation?: number;
    zoom?: vec2 | number;
}

class Canvas2DCamera extends Camera {
    size: Size;
    clearColor: string;
    position: vec2;
    rotation: number;
    zoom: vec2;

    _internalcanvas: HTMLCanvasElement;
    _internalContext: ImageBitmapRenderingContext;

    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;

    constructor(
        canvas: HTMLCanvasElement,
        { position, rotation, zoom }: Canvas2DCameraProperties = {}
    ) {
        super();

        if (!canvas) throw "Camera must have a canvas to draw to!";

        // this will get reset when _fitToContainer is called.
        this.size = { width: 0, height: 0 };
        this.clearColor = "black";

        this._internalcanvas = canvas;
        this._internalContext = this._internalcanvas.getContext("bitmaprenderer");

        this.canvas = new OffscreenCanvas(this.size.width, this.size.height);
        this.context = this.canvas.getContext("2d");

        if (position) this.position = position;
        else this.position = vec2.fromValues(0, 0);

        if (typeof rotation === "undefined") this.rotation = rotation;
        else this.rotation = 0;

        if (zoom) {
            if (typeof zoom === "number") this.zoom = vec2.fromValues(zoom, zoom);
            else this.zoom = zoom;
        } else this.zoom = vec2.fromValues(1, 1);

        // Set to parent now.
        this._fitToContainer();
    }

    _fitToContainer() {
        if (this._internalcanvas.width != this._internalcanvas.offsetWidth)
            this._internalcanvas.width = this._internalcanvas.offsetWidth;
        if (this._internalcanvas.height != this._internalcanvas.offsetHeight)
            this._internalcanvas.height = this._internalcanvas.offsetHeight;

        if (this.canvas.width != this._internalcanvas.width)
            this.canvas.width = this._internalcanvas.width;
        if (this.canvas.height != this._internalcanvas.height)
            this.canvas.height = this._internalcanvas.height;

        if (this.size.width != this._internalcanvas.width)
            this.size.width = this._internalcanvas.width;
        if (this.size.height != this._internalcanvas.height)
            this.size.height = this._internalcanvas.height;
    }

    // Clears the display. First step to draw.
    clear() {
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = this.clearColor;
        this.context.fillRect(0, 0, this.size.width, this.size.height);
        this.context.restore();
    }

    // Performs any transforms or calculations required to set up this camera's
    // view based on it's updated properties.
    calculateView(time: RefreshTime) {
        super.calculateView(time);

        // Reset the context to default.
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        // Update our canvas's context

        const hW = this.size.width / 2;
        const hH = this.size.height / 2;

        // Translate to center of view before rotating or zooming
        this.context.translate(hW, hH);

        this.context.scale(this.zoom[0], this.zoom[1]);
        this.context.rotate(this.rotation);

        // Then translate back.
        //this.translate(-hW, -hH);

        // Then position our camera.
        this.context.translate(-this.position[0], -this.position[1]);
    }

    // Saves the view state in a stack so that further modifications of the view can
    // be made, and the restored back.
    saveState() {
        this.context.save();
    }

    // Restores the last saved view state back to the current state.
    restoreState() {
        this.context.restore();
    }

    // Requests that the specified object draws itself on the canvas.
    drawObject(obj: GameObject, time: RefreshTime) {
        obj.draw(this, time);
    }

    // Requests that the specified object debug draws itself on the canvas.
    debugDrawObject(obj: GameObject, time: RefreshTime) {
        obj.debugDraw(this, time);
    }

    // Draws anything in the back buffer to the display buffer.
    drawDoubleBuffer() {
        this._internalContext.transferFromImageBitmap(this.canvas.transferToImageBitmap());
    }
}

export default Canvas2DCamera;
