import {vec2} from 'gl-matrix';
import CircleCollider from '../canvas-2d/collision-detection/circle-collider';
import Math2D from '../canvas-2d/math-2d';

import GameBaseObject from './game-base-object';
import Bullet from './bullet';
import Ship from './ship';

export default class Asteroid extends GameBaseObject {
    constructor(game, properties = { color: "#fff" }) {
        super(game, properties);
        this.classTags.push("asteroid");
        this.game = game;
        
        if(properties.onDestroyed)
            this._onDestroyed = properties.onDestroyed;
    }

    onDestroyed() {
        if(this._onDestroyed)
            this._onDestroyed(this);
    }

    onCollision(thisObj, otherObj) {
        if(!(otherObj.parent instanceof Asteroid))
            super.onCollision(thisObj, otherObj);
    }

    onCollided(thisObj, otherObj) {
        if(this.removed) return;

        if(otherObj.parent instanceof Bullet || otherObj.parent instanceof Ship) {
            this.removed = true;
            this.game.removeGameObject(this);//.then(this.split.bind(this));
            this.onDestroyed();
        } else if(!(otherObj.parent instanceof Asteroid)) {
            super.onCollided(thisObj, otherObj);
        }
    }
/*
    draw(time, camera, context){

        if(this.image) {
            const dpos = vec2.clone(this.position);
            vec2.subtract(dpos, dpos, vec2.fromValues(this.radius, this.radius));
            vec2.add(dpos, dpos, this.image.offset);
            const diam = this.radius * 2;
            context.drawImage(this.image.image, dpos[0], dpos[1], diam, diam);
        } else {
            context.fillStyle = this.color;
            context.beginPath();
            
            context.arc(this.position[0], this.position[1], this.radius, 0, Math2D.twoPi);
            context.fill();
        }
    }*/
}