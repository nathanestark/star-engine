import Canvas2DCamera from "../cameras/canvas-2d-camera";
import TextHud, { TextHudProperties } from "./text-hud";

export interface FPSHudProperties extends TextHudProperties {
    textSize?: number;
    fontType?: string;
    textColor?: string;
    text?: string;
    justify?: "left" | "right" | "center";
}

export default class FPSHud extends TextHud {
    _count: number;
    _lastPrint: number;
    _lastCalculateTime: number;
    _calculateInterval: number;

    constructor(properties: FPSHudProperties = {}) {
        super(properties);

        this._count = 0;
        this._lastPrint = 0;
        this._lastCalculateTime = 9999;
        this._calculateInterval = 0.5;
    }

    draw(camera: Canvas2DCamera) {
        this._count++;

        const time = new Date().getTime();
        const totalTime = (time - this._lastCalculateTime) / 1000;

        if (totalTime >= this._calculateInterval) {
            this._lastPrint = this._count / totalTime;
            this._lastCalculateTime = time;
            this._count = 0;
        }
        this.text = "FPS: " + this._lastPrint.toFixed(0);

        super.draw(camera);
    }
}
