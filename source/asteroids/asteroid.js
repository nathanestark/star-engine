import GameBaseObject from "./game-base-object";
import Bullet from "./bullet";
import Ship from "./ship";

export default class Asteroid extends GameBaseObject {
    constructor(game, properties = { color: "#fff" }) {
        super(game, properties);
        this.classTags.push("asteroid");
        this.game = game;

        if (properties.onDestroyed) this._onDestroyed = properties.onDestroyed;
    }

    onDestroyed() {
        if (this._onDestroyed) this._onDestroyed(this);
    }

    onCollision(thisObj, otherObj) {
        if (!(otherObj.parent instanceof Asteroid)) super.onCollision(thisObj, otherObj);
    }

    onCollided(thisObj, otherObj) {
        if (this.removed) return;

        if (otherObj.parent instanceof Bullet || otherObj.parent instanceof Ship) {
            this.removed = true;
            this.game.removeGameObject(this);
            this.onDestroyed();
        } else if (!(otherObj.parent instanceof Asteroid)) {
            super.onCollided(thisObj, otherObj);
        }
    }
}
