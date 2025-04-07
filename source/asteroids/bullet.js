import Math2D from "../canvas-2d/math-2d";
import GameBaseObject from "./game-base-object";
import Ship from "./ship";

export default class Bullet extends GameBaseObject {
    constructor(game, properties = {}) {
        super(
            game,
            (properties = Object.assign(
                {
                    mass: 0.1,
                    radius: 2
                },
                properties
            ))
        );
        this.classTags.push("bullet");
        this.color = "#860";

        if (properties.color) this.color = properties.color;
    }

    onCollided(thisObj, otherObj) {
        if (this.removed) return;

        const myParent = otherObj.parent instanceof Ship && otherObj.parent == this.owner;
        if (otherObj.parent instanceof GameBaseObject && !myParent) {
            this.removed = true;
            this.game.removeGameObject(this);
        } else {
            super.onCollided(thisObj, otherObj);
        }
    }

    draw(time, camera, context) {
        context.translate(this.position[0], this.position[1]);
        context.rotate(this.rotation);

        context.fillStyle = this.color;
        context.beginPath();

        context.arc(0, 0, this.radius, 0, Math2D.twoPi);
        context.fill();
    }
}
