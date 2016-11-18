import {vec2} from 'gl-matrix';
import BoundingBoxCollider from '../canvas-2d/collision-detection/bounding-box-collider';

export default class WorldBounds {
    constructor(properties = {}) {
        this.classTags = ["world"];

        this.color = "#ccc";
        this.position = vec2.create();
        this.size = vec2.fromValues(1,1);
        
        if (properties.position
            && properties.position instanceof Float32Array) {
            this.position = properties.position;
        }
        if (properties.size
            && properties.size instanceof Float32Array) {
            this.size = properties.size;
        }
        if (properties.color)
            this.color = properties.color;

        let pos1 = vec2.create();
        let pos2 = vec2.create();
        vec2.copy(pos1, this.position);
        vec2.add(pos2, this.position, this.size);
        this.bounds = [pos1, pos2];

        // Add a collider as a child.
        this.children = [
            new BoundingBoxCollider({parent: this})
        ];
    }

    update(tDelta) {
        // Make sure bounds is set correctly.
        vec2.copy(this.bounds[0], this.position);  
        vec2.add(this.bounds[1], this.position, this.size);
    }

    draw(tDelta, camera, context){
        context.strokeStyle = this.color;
        context.lineWidth = 1/camera.zoom[0];
        context.strokeRect(this.position[0], 
                           this.position[1], 
                           this.size[0], 
                           this.size[1]);
    }
    
    onCollision(thisObj, otherObj) {
        const newPos = this.obj
    }

}