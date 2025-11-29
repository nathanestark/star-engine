import GameObject from "source/core/game-object";
import Camera from "../../core/camera";
import { Size } from "../types";
import { RefreshTime } from "source/core/types";
import { vec3, mat4, quat } from "gl-matrix";
import { UboBindPoint } from "../ubo-bind-point-manager";

export interface Canvas3DCameraProperties {
    position?: vec3;
    rotation?: quat;
    zoom?: number;
    fieldOfView?: number;
    zNear?: number;
    zFar?: number;
}

class Canvas3DCamera extends Camera {
    size: Size = { width: 0, height: 0 };
    clearColor: string = "black";
    position: vec3 = vec3.fromValues(0, 0, 0);
    rotation: quat = quat.create();

    private _zoom: number = 1;
    private _fieldOfView: number = 90;
    private _zNear: number = 0.1;
    private _zFar: number = 1000;
    private _projectionMatrix: mat4 = mat4.create();
    private updateProjectionMatrix = true;

    private _viewMatrix: mat4 = mat4.create();
    private viewMatrixStack: Array<mat4> = [];

    canvas: HTMLCanvasElement;
    context: WebGL2RenderingContext;
    bindPoint: UboBindPoint;

    constructor(
        context: WebGL2RenderingContext,
        bindPoint: UboBindPoint,
        { position, rotation, zoom, fieldOfView, zNear, zFar }: Canvas3DCameraProperties = {}
    ) {
        super();

        if (!context) throw "Camera must have a context to draw to!";

        context.enable(context.DEPTH_TEST);
        context.depthFunc(context.LEQUAL);

        // this will get reset when fitToContainer is called.
        this.size = { width: 0, height: 0 };
        this.clearColor = "black";

        this.bindPoint = bindPoint;
        this.context = context;

        if (position) this.position = position;
        if (rotation) this.rotation = rotation;

        if (zoom !== undefined) this.zoom = zoom;
        if (fieldOfView !== undefined) this.fieldOfView = fieldOfView;
        if (zNear !== undefined) this.zNear = zNear;
        if (zFar !== undefined) this.zFar = zFar;

        // Set to parent now.
        this.fitToContainer();

        this.init();
    }

    get zoom() {
        return this._zoom;
    }
    set zoom(value: number) {
        this._zoom = value;
        this.updateProjectionMatrix = true;
    }

    get fieldOfView() {
        return this._fieldOfView;
    }
    set fieldOfView(value: number) {
        this._fieldOfView = value;
        this.updateProjectionMatrix = true;
    }

    get zNear() {
        return this._zNear;
    }
    set zNear(value: number) {
        this._zNear = value;
        this.updateProjectionMatrix = true;
    }

    get zFar() {
        return this._zFar;
    }
    set zFar(value: number) {
        this._zFar = value;
        this.updateProjectionMatrix = true;
    }

    get viewMatrix() {
        return this._viewMatrix;
    }

    get projectionMatrix() {
        return this._projectionMatrix;
    }

    private fitToContainer() {
        const canvas = this.context.canvas;
        const newSize = { width: canvas.width, height: canvas.height };
        if (canvas instanceof HTMLCanvasElement) {
            newSize.width = Math.floor(canvas.clientWidth);
            newSize.height = Math.floor(canvas.clientHeight);

            if (canvas.width !== newSize.width) canvas.width = newSize.width;
            if (canvas.height !== newSize.height) canvas.height = newSize.height;
        }
        if (this.size.width != newSize.width) {
            this.size.width = newSize.width;
            this.updateProjectionMatrix = true;
        }
        if (this.size.height != newSize.height) {
            this.size.height = newSize.height;
            this.updateProjectionMatrix = true;
        }
    }

    private uboBuffer: WebGLBuffer = null;

    private init() {
        const gl = this.context;
        // Create Uniform Buffer to store our data
        this.uboBuffer = gl.createBuffer();

        // Bind it to tell WebGL we are working on this buffer
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);

        // Allocate memory for our buffer equal to the size of our Uniform Block
        // We use dynamic draw because we expect to respecify the contents of the buffer frequently
        gl.bufferData(gl.UNIFORM_BUFFER, this.bindPoint.size, gl.DYNAMIC_DRAW);

        // Bind the buffer to a binding point
        // Think of it as storing the buffer into a special UBO ArrayList
        // The second argument is the index you want to store your Uniform Buffer in
        // Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.bindPoint.index, this.uboBuffer);

        // Unbind buffer when we're done using it for now
        // Good practice to avoid unintentionally working on it
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    // Clears the display. First step to draw.
    clear() {
        // Clear out the matrix stack and reset the current matrix on each clear.
        // this.viewMatrixStack = [];
        // mat4.identity(this._viewMatrix);

        this.context.clearColor(0.0, 0.0, 0.0, 1.0); // TODO: use this.clearColor
        this.context.clearDepth(1.0);
        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }

    computeProjection(): mat4 {
        return mat4.perspective(
            mat4.create(),
            (this.zoom * (this.fieldOfView * Math.PI)) / 180,
            this.size.width / this.size.height,
            this.zNear,
            this.zFar
        );
    }

    computeView() {
        const newView = mat4.fromRotationTranslation(mat4.create(), this.rotation, this.position);
        return mat4.invert(newView, newView);
    }

    // Performs any transforms or calculations required to set up this camera's
    // view based on its updated properties.
    calculateView(time: RefreshTime) {
        super.calculateView(time);

        this.fitToContainer();

        if (!this.uboBuffer) return;

        const gl = this.context;

        let bufferSet = false;

        if (this.updateProjectionMatrix) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            const newProjectionMatrix = this.computeProjection();
            if (!mat4.equals(newProjectionMatrix, this._projectionMatrix)) {
                // We've had projection matrix changes, so update our value.
                if (!bufferSet) {
                    gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);
                    bufferSet = true;
                }

                mat4.copy(this._projectionMatrix, newProjectionMatrix);
                gl.bufferSubData(
                    gl.UNIFORM_BUFFER,
                    this.bindPoint.variables.projectionMatrix.offset,
                    new Float32Array(this._projectionMatrix)
                );
            }
            this.updateProjectionMatrix = false;
        }

        const newViewMatrix = this.computeView();
        if (!mat4.equals(newViewMatrix, this._viewMatrix)) {
            // We've had view matrix changes, so update our value.
            if (!bufferSet) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboBuffer);
                bufferSet = true;
            }

            mat4.copy(this._viewMatrix, newViewMatrix);
            gl.bufferSubData(
                gl.UNIFORM_BUFFER,
                this.bindPoint.variables.viewMatrix.offset,
                new Float32Array(this._viewMatrix)
            );
        }

        if (bufferSet) {
            // Unbind for good measure.
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        }
    }

    // Saves the view state in a stack so that further modifications of the view can
    // be made, and the restored back.
    saveState() {
        this.viewMatrixStack.push(mat4.clone(this._viewMatrix));
    }

    // Restores the last saved view state back to the current state.
    restoreState() {
        if (this.viewMatrixStack.length > 0) this._viewMatrix = this.viewMatrixStack.pop();
        else {
            // Reset to identity, if our stack is empty.
            mat4.identity(this._viewMatrix);
        }
    }

    // Requests that the specified object draws itself on the canvas.
    drawObject(obj: GameObject, time: RefreshTime) {
        obj.draw(this, time);
    }

    // Requests that the specified object debug draws itself on the canvas.
    debugDrawObject(obj: GameObject, time: RefreshTime) {
        obj.debugDraw(this, time);
    }
}

export default Canvas3DCamera;
