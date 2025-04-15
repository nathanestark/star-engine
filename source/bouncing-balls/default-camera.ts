import Canvas2DCamera, {
    Canvas2DCameraProperties
} from "source/canvas-2d/cameras/canvas-2d-camera";

export default class DefaultCamera extends Canvas2DCamera {
    constructor(canvas: HTMLCanvasElement, properties: Canvas2DCameraProperties) {
        super(canvas, properties);
    }
}
