import FollowCamera, { FollowCameraProperties } from "../canvas-2d/cameras/follow-camera";

export default class DefaultCamera extends FollowCamera {
    constructor(canvas: HTMLCanvasElement, properties: FollowCameraProperties) {
        super(canvas, properties);
    }
}
