import { vec2 } from "gl-matrix";
import Game from "source/core/game";
import GameObject from "source/core/game-object";
import { RefreshTime } from "source/core/types";
import Canvas2DCamera from "../cameras/canvas-2d-camera";

export interface HudProperties {
    position?: vec2;
}

export default class Hud extends GameObject {
    position: vec2;

    constructor({ position }: HudProperties = {}) {
        super();
        this.classTags = ["hud"];

        if (position) this.position = position;
        else this.position = vec2.fromValues(0, 0);
    }

    draw(camera: Canvas2DCamera) {
        camera.context.translate(this.position[0], this.position[1]);
    }
}
