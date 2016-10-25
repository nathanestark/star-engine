import TextHud from './text-hud';


export default class FPSHud extends TextHud {
    constructor(properties = {}) {
        super(properties);
        
        this._weight = 0.9;
        this._lastTime = 0;
        this._lastPrint = 0;
        this._lastCalculateTime = 9999;
        this._calculateInterval = 0.5;
    }

    draw(tDelta, camera, context) {

        this._lastTime = (1 / tDelta) * (1.0 - this._weight) + (this._lastTime * this._weight);

        this._lastCalculateTime += tDelta;
        if (this._lastCalculateTime >= this._calculateInterval) {
            this._lastCalculateTime = 0;
            this._lastPrint = this._lastTime;
        }
        this.text = "FPS: " + this._lastPrint.toFixed(0);

        super.draw(tDelta, camera, context);
    }
}