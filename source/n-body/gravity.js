import {vec3} from 'gl-matrix';

export default class Gravity {
    constructor(game, properties = {}) {
        this.classTags = ["action"];

        this._game = game;

        this.g = 0.00000000006674;
        if (typeof (properties.g) === 'number') {
            this.g = properties.g;
        }
    }

    update(tDelta) {
        // Grab all world objects that have mass.
        const objs = this._game.filter("body").filter(function (obj) { return obj.mass > 0; });

        // Compare each one and calculate attraction via newton
        for (let i = 0; i < objs.length; i++) {
            for (let j = i+1; j < objs.length; j++) {
                const m1 = objs[i].mass;
                const m2 = objs[j].mass;

                const p1 = objs[i].position;
                const p2 = objs[j].position;

                const tf1 = objs[i].totalForce;
                const tf2 = objs[j].totalForce;

                // Calculate direction from p1 to p2, normalized.
                const dir = vec3.create();
                vec3.sub(dir, p1, p2);

                // Calculate radius
                const r = vec3.len(dir);

                // Normalize direction
                vec3.normalize(dir, dir);               

                // Then scalar force of attraction.
                const f = (this.g * m1 * m2) / (r * r);

                // Now scale our direction by the attraction.
                vec3.scale(dir, dir, f);

                // Add to 2nd object's total force.
                vec3.add(tf2, tf2, dir);

                // Negate and add to 1st object's total force.
                vec3.negate(dir, dir);
                vec3.add(tf1, tf1, dir);
            }
        }
    }
}