import Canvas2DDefaultCamera from '../canvas-2d/cameras/default-camera';
import { vec2 } from 'gl-matrix';

export default class DefaultCamera extends Canvas2DDefaultCamera {
    constructor(canvas, properties) {
        super(canvas, properties);
    }
}