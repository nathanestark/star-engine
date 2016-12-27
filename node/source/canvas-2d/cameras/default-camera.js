import Canvas2DCamera from './canvas-2d-camera';
import { vec2 } from 'gl-matrix';

export default class DefaultCamera extends Canvas2DCamera {
    constructor(canvas, properties = {}) {
        super(canvas);

        if(properties.position)
            this.position = properties.position;
        else
            this.position = vec2.fromValues(0,0);
        
        if(properties.rotation)
            this.rotation = properties.rotation;
        else
            this.rotation = 0;

        if(properties.zoom) {
            if(typeof(properties.zoom) === 'number')
                this.zoom = vec2.fromValues(properties.zoom, properties.zoom);
            else
                this.zoom = properties.zoom;
        }
        else
            this.zoom = vec2.fromValues(1,1);
    }
    
    calculateView(time) {
        super.calculateView(time);

        // Reset the context to default.
        this.drawContext.setTransform(1, 0, 0, 1, 0, 0);

        // Update our canvas's context
        
        const hW = this.size.width/2;
        const hH = this.size.height/2;

        // Translate to center of view before rotating or zooming
        this.drawContext.translate(hW, hH);

        this.drawContext.scale(this.zoom[0], this.zoom[1]);
        this.drawContext.rotate(this.rotation);

        // Then translate back.
        //this.drawContext.translate(-hW, -hH);

        // Then position our camera.
        this.drawContext.translate(-this.position[0], -this.position[1]);
    }
}