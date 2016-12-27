import DefaultCamera from './default-camera';
import { vec2 } from 'gl-matrix';

export default class FollowCamera extends DefaultCamera {
    constructor(canvas, properties = {}) {
        super(canvas);

        if(properties.target)
            this.target = properties.target;
        else
            this.target = null;
    }
    
    update(tDelta) {
        // Set our position to our target's position
        if(this.target) {
            if(this.target.position) {
                vec2.copy(this.position, this.target.position);
            }
        }
    }
}