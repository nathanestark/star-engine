import {vec2} from 'gl-matrix';

export default class Hud {
    constructor(properties = {}) {
        this.classTags = ["hud"];

        if(properties.position)
            this.position = properties.position;
        else
            this.position = vec2.fromValues(0,0);
    }

    draw(tDelta, camera, context) {
        context.translate(this.position[0], this.position[1]);
    }
}