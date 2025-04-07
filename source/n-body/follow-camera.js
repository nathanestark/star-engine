import Canvas2DFollowCamera from "../canvas-2d/cameras/follow-camera";

export default class FollowCamera extends Canvas2DFollowCamera {
    constructor(canvas, properties = {}) {
        super(canvas, properties);

        if (properties.view) this.view = properties.view;
        else this.view = "x";

        this.minShowRadius = 0;
        this.objectScale = 1;
    }
}
