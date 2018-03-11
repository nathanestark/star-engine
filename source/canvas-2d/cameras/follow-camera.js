import DefaultCamera from './default-camera';
import { vec2 } from 'gl-matrix';

export default class FollowCamera extends DefaultCamera {
    constructor(canvas, properties = {}) {
        super(canvas, properties);

        if(properties.target)
            this.target = properties.target;
        else
            this.target = null;

        if(properties.offset)
            this.offset = properties.offset;
        else
            this.offset = vec2.fromValues(0,0);
    }
    
    update(tDelta) {
        // Set our position to our target's position
        if(this.target) {
            if(this.target.position) {
                if (this.view == "x") {
                    vec2.copy(this.position, [this.target.position[0], this.target.position[1]]);
                } else if (this.view == "y") {
                    vec2.copy(this.position, [this.target.position[0], this.target.position[2]]);
                } else if (this.view == "z") {
                    vec2.copy(this.position, [-this.target.position[1], this.target.position[2]]);
                }
                vec2.add(this.position, this.position, this.offset);
            }
        }
    }
}