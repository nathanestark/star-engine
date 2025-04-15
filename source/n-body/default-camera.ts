import Canvas2DDefaultCamera, {
    Canvas2DCameraProperties
} from "../canvas-2d/cameras/canvas-2d-camera";

export interface DefaultCameraProperties extends Canvas2DCameraProperties {
    view?: "x" | "y" | "z";
}

export default class DefaultCamera extends Canvas2DDefaultCamera {
    view: "x" | "y" | "z";
    minShowRadius: number;
    objectScale: number;

    constructor(canvas: HTMLCanvasElement, { view, ...superProps }: DefaultCameraProperties) {
        super(canvas, superProps);

        if (view) this.view = view;
        else this.view = "x";

        this.minShowRadius = 0;
        this.objectScale = 1;
    }
}
