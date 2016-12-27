import {vec2} from 'gl-matrix';

import Hud from './hud';


export default class TextHud extends Hud {
    constructor(properties = {}) {
        super(properties);
        
        if(properties.textSize)
            this.textSize = properties.textSize;
        else
            this.textSize = 14;

        if(properties.fontType)
            this.fontType = properties.fontType;
        else
            this.fontType = "monospace";

        if(properties.textColor)
            this.textColor = properties.textColor;
        else
            this.textColor = "#ccc";
            
        if(properties.text)
            this.text = properties.text;
        else
            this.text = "";
            
        if(properties.justify)
            this.justify = properties.justify;
        else
            this.justify = 'left';
    }

    draw(tDelta, camera, context) {
        super.draw(tDelta, camera, context);
        
        context.fillStyle = this.textColor;
        context.font = this.textSize + "px " + this.fontType;

        // Translate half the font size so we're drawing on the baseline.
        context.translate(0, this.textSize/2);
        
        // Translate for justification
        if(this.justify == 'center')
            context.translate(-context.measureText(this.text).width/2, 0);
        else if(this.justify == 'right')
            context.translate(-context.measureText(this.text).width, 0);

        context.fillText(this.text, 0, 0);
    }
}