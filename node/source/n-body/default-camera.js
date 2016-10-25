import Canvas2DDefaultCamera from '../canvas-2d/cameras/default-camera';
import { vec2 } from 'gl-matrix';

export default class DefaultCamera extends Canvas2DDefaultCamera {
    constructor(canvas, properties) {
        super(canvas, properties);

        if(properties.view)
            this.view = properties.view;
        else
            this.view = "x";

        this.minShowRadius = 0;
        this.objectScale = 1;
        this.drawnOrbitLength = 0;
    }
}