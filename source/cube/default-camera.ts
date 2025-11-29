import Canvas3DCamera, {
    Canvas3DCameraProperties
} from "source/canvas-3d/cameras/canvas-3d-camera";
import { UboBindPoint } from "source/canvas-3d/ubo-bind-point-manager";

export default class DefaultCamera extends Canvas3DCamera {
    constructor(
        context: WebGL2RenderingContext,
        bindPoint: UboBindPoint,
        properties: Canvas3DCameraProperties
    ) {
        super(context, bindPoint, properties);
    }
}
