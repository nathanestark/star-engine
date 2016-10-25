import TextHud from '../canvas-2d/huds/text-hud';


export default class ObjectCountHud extends TextHud {
    constructor(game, properties) {
        super(properties);

        this._game = game;

        this._lastPrint = 0;
        this._lastCalculateTime = 9999;
        this._calculateInterval = 0.5;
    }

    update(tDelta) {        
        this._lastCalculateTime += tDelta;
        if (this._lastCalculateTime >= this._calculateInterval) {
            this._lastCalculateTime = 0;
            this._lastPrint = this._game.filter({ op: 'exclusive', tags: ["body"] }).length;
        }
        this.text = "# Bodies: " + this._lastPrint.toFixed(0);
    }
}