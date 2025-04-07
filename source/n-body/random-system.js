import { vec3, quat } from "gl-matrix";

import Body from "./body";

export default class RandomWorldObjects {
    constructor(gravity) {
        this.objects = {
            children: []
        };

        const sPos = vec3.fromValues(0, 0, 0);
        const m = 2e30;
        let r = Math.pow(m / ((4 * Math.PI) / 3), 1 / 3);
        this.objects.children.push(
            new Body({
                position: sPos,
                velocity: vec3.fromValues(0, 0, 0),
                mass: m,
                radius: r,
                color: "red",
                name: "Sun"
            })
        );

        const bodies = [];
        for (let x = 0; x < 200; x++) {
            let mass = Math.random() * m;
            const p = Math.random();
            if (p < 0.85) mass /= 1e15;
            else if (p < 0.88) mass /= 1e9;
            else if (p < 0.93) mass /= 1e6;
            else if (p < 0.96) mass /= 1e3;
            else if (p < 0.98) mass /= 1e2;
            else mass /= 1e1;

            let r = Math.pow(mass / ((4 * Math.PI) / 3), 1 / 3);
            const pDist = Math.random() * 1e12 + 1000; // But not too close...
            const pos = vec3.fromValues(1, 0, 0);
            vec3.scale(pos, pos, pDist);

            bodies.push(
                new Body({
                    position: pos,
                    velocity: vec3.create(),
                    mass: mass,
                    radius: r,
                    color: "#fff"
                })
            );
        }

        // Sort them from closest to furthest.
        bodies.sort(function (b1, b2) {
            return vec3.length(b1.position) - vec3.length(b2.position);
        });

        // Calculate velocity.
        for (var x = 0; x < bodies.length; x++) {
            const body = bodies[x];

            //var pDist = vec3.length(body.position);

            const rotQuat = quat.identity(quat.create());
            quat.rotateZ(rotQuat, rotQuat, Math.random() * Math.PI * 2);
            quat.rotateY(rotQuat, rotQuat, Math.random() * (Math.PI / 50) - Math.PI / 100);
            quat.rotateX(rotQuat, rotQuat, Math.random() * (Math.PI / 50) - Math.PI / 100);
            vec3.transformQuat(body.position, body.position, rotQuat);
            //vec3.scale(body.position, body.position, pDist);

            const dir = vec3.create();
            vec3.sub(dir, body.position, sPos);
            const rDist = vec3.len(dir);

            let speed = Math.sqrt((gravity.g * (body.mass + m)) / rDist);
            // Add in some variation on speed.
            let sVar = Math.random();
            if (sVar < 0.5) speed = speed * sVar * 2;

            const velocity = body.velocity;
            vec3.normalize(velocity, dir);
            quat.identity(rotQuat);
            quat.rotateZ(rotQuat, rotQuat, -Math.PI / 2);
            vec3.transformQuat(velocity, velocity, rotQuat);
            vec3.scale(velocity, velocity, speed);

            body.velocity = velocity;

            // Then add this body's mass to the global mass.
            //m += body.mass/2;

            this.objects.children.push(body);
        }
    }
}
