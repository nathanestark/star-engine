import FollowCamera from '../canvas-2d/cameras/follow-camera';
import { vec2 } from 'gl-matrix';

export default class DefaultCamera extends FollowCamera {
    constructor(canvas, properties) {
        super(canvas, properties);
    }
}