import Game from "source/core/game";
import TextHud, { TextHudProperties } from "../canvas-2d/huds/text-hud";
import { RefreshTime } from "source/core";

export default class ObjectCountHud extends TextHud {
    _lastPrint: number;
    _lastCalculateTime: number;
    _calculateInterval: number;
    constructor(properties: TextHudProperties) {
        super(properties);

        this._lastPrint = 0;
        this._lastCalculateTime = 9999;
        this._calculateInterval = 0.5;
    }

    update(time: RefreshTime) {
        this._lastCalculateTime += time.timeAdvance;
        if (this._lastCalculateTime >= this._calculateInterval) {
            this._lastCalculateTime = 0;
            this._lastPrint = this.game.filter({ op: "exclusive", tags: ["ball"] }).length;
        }
        this.text = "# Balls: " + this._lastPrint.toFixed(0);
    }
}
