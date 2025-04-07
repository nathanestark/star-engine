import TextHud from "./text-hud";

export default class FPSHud extends TextHud {
    constructor(properties = {}) {
        super(properties);

        this._count = 0;
        this._lastPrint = 0;
        this._lastCalculateTime = 9999;
        this._calculateInterval = 0.5;
    }

    draw(tDelta, camera, context) {
        this._count++;

        const time = new Date().getTime();
        const totalTime = (time - this._lastCalculateTime) / 1000;

        if (totalTime >= this._calculateInterval) {
            this._lastPrint = this._count / totalTime;
            this._lastCalculateTime = time;
            this._count = 0;
        }
        this.text = "FPS: " + this._lastPrint.toFixed(0);

        super.draw(tDelta, camera, context);
    }
}
