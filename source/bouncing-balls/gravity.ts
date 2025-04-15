import { vec2 } from "gl-matrix";
import GameObject from "source/core/game-object";
import Ball from "./ball";

export interface GravityProperties {
    g?: number;
}

export default class Gravity extends GameObject {
    g: number;

    constructor({ g }: GravityProperties = {}) {
        super();
        this.classTags = ["action"];

        this.g = -9.8;
        if (typeof g === "number") {
            this.g = g;
        }
    }

    update() {
        // Grab all world objects that have mass.
        const objs = this.game.filter("ball") as Array<Ball>;

        // Compare each one and calculate attraction via newton
        for (let i = 0; i < objs.length; i++) {
            const m = objs[i].mass;

            const tf = objs[i].totalForce;

            // Fabricate direction of gravity.
            const dir = vec2.fromValues(0, 1);

            // Normalize direction
            vec2.normalize(dir, dir);

            // Then scalar force of attraction.
            const f = this.g * m;

            // Now scale our direction by the attraction.
            vec2.scale(dir, dir, f);

            // Negate and add to 1st object's total force.
            vec2.negate(dir, dir);
            vec2.add(tf, tf, dir);
        }
    }
}
