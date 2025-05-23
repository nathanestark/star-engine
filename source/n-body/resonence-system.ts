import { vec3, quat } from "gl-matrix";

import Body from "./body";
import Gravity from "./gravity";

interface LocalBody extends Body {
    satellites?: Array<LocalBody>;
}

const MIN_GEN_SIZE = 1e20;
export default class ResonenceWorldObjects {
    gravity: Gravity;
    objects: {
        children: Array<LocalBody>;
    };

    constructor(gravity: Gravity) {
        this.gravity = gravity;

        let children: Array<Body> = [];
        const walk = (parent: LocalBody) => {
            children.push(parent);
            if (parent.satellites)
                parent.satellites.forEach((c) => {
                    walk(c);
                });
        };

        const sun = this.generateBody(2e30);
        sun.color = "red";
        sun.name = "sun";
        walk(sun);

        this.objects = {
            children: children
        };
    }

    getDensity() {
        // Density is based on the type of planet.
        // For now just return water.
        return 1;
    }

    generateBody(mass: number, parent?: LocalBody, period?: number) {
        // Get Density
        const density = this.getDensity();

        // Calc Radius
        let radius = Math.pow((0.75 * mass) / (density * Math.PI), 1 / 3);
        //let radius = Math.pow(mass / (4 * Math.PI / 3), 1 / 3);

        // Calc position + vel
        let pDist = 0;
        let pos = vec3.fromValues(1, 0, 0);
        let velocity = vec3.create();
        if (parent) {
            // Calculate Position
            pDist = Math.pow(
                ((this.gravity.g * parent.mass * period * period) / 4) * Math.PI * Math.PI,
                1 / 3
            );
            vec3.scale(pos, pos, pDist);

            // Calculate velocity.
            const rotQuat = quat.identity(quat.create());
            quat.rotateZ(rotQuat, rotQuat, Math.random() * Math.PI * 2);
            quat.rotateY(rotQuat, rotQuat, Math.random() * (Math.PI / 50) - Math.PI / 100);
            quat.rotateX(rotQuat, rotQuat, Math.random() * (Math.PI / 50) - Math.PI / 100);
            vec3.transformQuat(pos, pos, rotQuat);

            // Add parent's position
            vec3.add(pos, pos, parent.position);

            const dir = vec3.create();
            vec3.sub(dir, pos, parent.position);
            const rDist = vec3.len(dir);

            let speed = Math.sqrt((this.gravity.g * (mass + parent.mass)) / rDist);

            vec3.normalize(velocity, dir);
            quat.identity(rotQuat);
            quat.rotateZ(rotQuat, rotQuat, -Math.PI / 2);
            vec3.transformQuat(velocity, velocity, rotQuat);
            vec3.scale(velocity, velocity, speed);

            // Add parent's velocity.
            vec3.add(velocity, velocity, parent.velocity);
        }

        const body = new Body({
            position: pos,
            velocity: velocity,
            mass: mass,
            radius: radius,
            color: "#fff"
        }) as LocalBody;

        if (mass > MIN_GEN_SIZE) {
            // Generate satellites
            const satellites = [];
            {
                // Calculate hill sphere radius for the maximum.
                // If our parent doesn't have a parent, then this is ignored.
                const max = parent
                    ? pDist * Math.pow(mass / (3 * parent.mass), 1 / 3)
                    : Number.MAX_VALUE;

                // Calculate resonence
                const resonence = 1.75 + Math.random() * 2.25; // Sol is 2.

                const maxPeriod = parent
                    ? Math.sqrt(
                          (Math.pow(max, 3) * 4 * Math.PI * Math.PI) / (this.gravity.g * mass)
                      )
                    : Number.MAX_VALUE;

                // Initial period will be determined with the first satellite.
                let t0 = null;

                // Determine how much total mass the satellites will make up.
                // Typical mass ratios is 10,000:1. Try to make that our center
                // In a range of inf:1->5,000:1?
                let totalMass = Math.random() * (mass / 5000);

                // Determine how many satellites we'll have
                // I made this up. Should give us 0-1 for smallest bodies,
                // up to 4 for earth like bodies, up to 10 for suns.
                let numSats = Math.round(Math.random() * (Math.pow(Math.log10(mass), 2.7) / 1000));

                // If we have no parent, we need at least one.
                if (!parent) numSats = Math.max(numSats, 1);

                for (let x = 0; x < numSats && totalMass > 0; x++) {
                    // Calculate mass for new body.
                    let cMass = totalMass;
                    if (x < numSats - 1) {
                        cMass = Math.random() * cMass;
                        const p = Math.random();
                        if (p < 0.4) cMass /= Math.pow(10, Math.log10(mass) / 3);
                        else if (p < 0.7) cMass /= Math.pow(10, Math.log10(mass) / 5);
                        else if (p < 0.9) cMass /= Math.pow(10, Math.log10(mass) / 10);
                    }

                    // Get density for new body.
                    const cDensity = this.getDensity();
                    // Radius
                    const cRadius = Math.pow((0.75 * cMass) / (cDensity * Math.PI), 1 / 3);

                    // Calculate Roche limit for our min satellite distance.
                    const min = 1.26 * cRadius * Math.pow(mass / cMass, 1 / 3);
                    const minPeriod = Math.sqrt(
                        (Math.pow(min, 3) * 4 * Math.PI * Math.PI) / (this.gravity.g * mass)
                    );

                    if (t0 == null) t0 = minPeriod * (Math.random() * 10); // Make T0 somewhere between 1 and 10 of the roche limit.
                    let cPeriod = t0 * Math.pow(resonence, x);

                    // Period can't be greater than max.
                    if (cPeriod > maxPeriod) break;

                    // Introduce some random variation for flavor (up to 10%)
                    let deviation = (Math.random() - Math.random()) * ((x + 1) * 0.02);
                    cPeriod = cPeriod * (1 + deviation);

                    totalMass -= cMass;

                    satellites.push(this.generateBody(cMass, body, cPeriod));
                }
            }
            body.satellites = satellites;
        }

        return body;
    }
}
