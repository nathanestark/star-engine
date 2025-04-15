import Canvas2DCamera from "../cameras/canvas-2d-camera";
import Hud, { HudProperties } from "./hud";

export interface TextHudProperties extends HudProperties {
    textSize?: number;
    fontType?: string;
    textColor?: string;
    text?: string;
    justify?: "left" | "right" | "center";
}

export default class TextHud extends Hud {
    textSize: number;
    fontType: string;
    textColor: string;
    text: string;
    justify: "left" | "right" | "center";

    constructor({
        textSize,
        fontType,
        textColor,
        text,
        justify,
        ...superProps
    }: TextHudProperties = {}) {
        super(superProps);

        if (textSize) this.textSize = textSize;
        else this.textSize = 14;

        if (fontType) this.fontType = fontType;
        else this.fontType = "monospace";

        if (textColor) this.textColor = textColor;
        else this.textColor = "#ccc";

        if (text) this.text = text;
        else this.text = "";

        if (justify) this.justify = justify;
        else this.justify = "left";
    }

    draw(camera: Canvas2DCamera) {
        super.draw(camera);

        camera.context.fillStyle = this.textColor;
        camera.context.font = this.textSize + "px " + this.fontType;

        // Translate half the font size so we're drawing on the baseline.
        camera.context.translate(0, this.textSize / 2);

        // Translate for justification
        if (this.justify == "center")
            camera.context.translate(-camera.context.measureText(this.text).width / 2, 0);
        else if (this.justify == "right")
            camera.context.translate(-camera.context.measureText(this.text).width, 0);

        camera.context.fillText(this.text, 0, 0);
    }
}
