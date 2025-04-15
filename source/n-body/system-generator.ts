import { vec3, quat } from "gl-matrix";

import Body from "./body";

const G = 0.00000000006674;
const LY = 9460730472580800;
const AU = 149597870700;
const SolM = 1988550000000000000000000000000;
const SolR = 696342000;
const TerraM = 5973600000000000000000000;
const TerraR = 6371000;
const TerraD = TerraM / ((4 / 3) * Math.PI * Math.pow(TerraR, 3));

const Epoch = Date.UTC(2000, 0, 1, 12, 0, 0) / 1000; // use J2000, in seconds.
// const DefaultTime = Date.now() / 1000 - Epoch; // In Seconds.

interface FrequencyOpt {
    frequency: number;
}

type SystemType =
    | "single"
    | "binary"
    | "triple"
    | "quadruple"
    | "quintuple"
    | "sextuple"
    | "septuple";
type StarType = "M" | "K" | "G" | "F" | "A" | "B" | "O";

interface StarTypeGen extends FrequencyOpt {
    type: StarType;
    mass?: RngVal;
    radius?: RngVal;
}
interface SystemTypeGen extends FrequencyOpt {
    type: SystemType;
    numStars: number;
    numPlanetoids: RngVal;
    starTypeFrequency?: Array<StarTypeGen>;
}

type BinaryStarType = "contact" | "closeDetached" | "wide" | "closeSemidetached" | "closeContact";
interface BinaryStarTypeGen extends FrequencyOpt {
    type: BinaryStarType;
}

type PlanetoidType =
    | "smallRocky"
    | "rocky"
    | "superRocky"
    | "gasGiant"
    | "superGasGiant"
    | "iceGiant";
interface PlanetoidTypeGen extends FrequencyOpt {
    type: PlanetoidType;
    mass: RngVal;
    density: RngVal;
    numMoons: RngVal;
    avgMoonMassRatio: number;
    maxMoonMassRatio: number;
    chanceOfRings: number;
    ringMassRatio?: RngVal;
}

interface EccentricityTypeGen extends FrequencyOpt {
    eccentricity: RngVal;
}
interface InclinationTypeGen extends FrequencyOpt {
    inclination: RngVal;
}

interface GenDef {
    minGeneratedBodySize?: number;
    // Types of systems generated with frequency
    systemTypes: Array<SystemTypeGen>;

    // Types of binary stars with frequency
    binarySystemTypes: Array<BinaryStarTypeGen>;

    // Type of star generated with frequency.
    starTypes: Array<StarTypeGen>;

    // Type of non-star body generated with frequency.
    // Zones?
    //  hot, habitable, icy, outer
    planetoidTypes: Array<PlanetoidTypeGen>;

    // Orbital Eccentricity
    eccentricityTypes: Array<EccentricityTypeGen>;

    // Orbital inclination
    inclinationTypes: Array<InclinationTypeGen>;
}

interface Orbital {
    period?: number;
    eccentricity?: number;
    inclination?: number;
    apoapsis?: number;
    periapsis?: number;
    longitudeOfAscendingNode?: number;
    argumentOfPeriapsis?: number;
    meanAnomalyAtEpoch?: number;
    meanAnomaly?: number;

    velocity?: vec3;
    position?: vec3;
}

interface SubSystem extends Orbital {
    type: "subsystem";
    subType?: "star" | BinaryStarType | "planet";
    numStars?: number;
    children: Array<SubSystem | Star | Planetoid>;
    readonly mass: number;
    readonly radius: number;

    velocity: vec3;
    position: vec3;
}

interface Star extends Orbital {
    id: number;
    type: "star";
    subType?: StarType;
    readonly mass: number;
    readonly radius: number;
    density: number;
    children: Array<SubSystem | Star | Planetoid>;
}

interface Planetoid extends Orbital {
    id: number;
    type: "planet" | "moon";
    subType?: PlanetoidType;
    numMoons?: number;
    maxMoonMass?: number;
    ringMass?: number;
    readonly mass: number;
    readonly radius: number;
    density: number;

    moons?: Array<Planetoid>;
    children: Array<SubSystem | Star | Planetoid>;
}

const DEFAULTS: GenDef = {
    // Don't generate objects smaller than this.
    minGeneratedBodySize: 1e20,
    // Types of systems generated with frequency
    systemTypes: [
        {
            type: "single",
            numStars: 1,
            numPlanetoids: { min: 0, max: 50 },
            frequency: 0.5962
        },
        {
            type: "binary",
            numStars: 2,
            numPlanetoids: { min: 0, max: 25 },
            starTypeFrequency: [
                { type: "M", frequency: 1 },
                { type: "K", frequency: 2 },
                { type: "G", frequency: 3 },
                { type: "F", frequency: 2 },
                { type: "A", frequency: 1 },
                { type: "B", frequency: 0.1 },
                { type: "O", frequency: 0.01 }
            ],
            frequency: 0.3152
        },
        {
            type: "triple",
            numStars: 3,
            numPlanetoids: { min: 0, max: 20 },
            starTypeFrequency: [
                { type: "M", frequency: 1 },
                { type: "K", frequency: 2 },
                { type: "G", frequency: 3 },
                { type: "F", frequency: 3 },
                { type: "A", frequency: 2 },
                { type: "B", frequency: 1 },
                { type: "O", frequency: 0.1 }
            ],
            frequency: 0.0625
        },
        {
            type: "quadruple",
            numStars: 4,
            numPlanetoids: { min: 0, max: 17 },
            starTypeFrequency: [
                { type: "M", frequency: 3 },
                { type: "K", frequency: 4 },
                { type: "G", frequency: 4 },
                { type: "F", frequency: 3 },
                { type: "A", frequency: 2 },
                { type: "B", frequency: 1 },
                { type: "O", frequency: 0.5 }
            ],
            frequency: 0.0188
        },
        {
            type: "quintuple",
            numStars: 5,
            numPlanetoids: { min: 0, max: 15 },
            starTypeFrequency: [
                { type: "M", frequency: 3 },
                { type: "K", frequency: 3 },
                { type: "G", frequency: 3 },
                { type: "F", frequency: 2 },
                { type: "A", frequency: 2 },
                { type: "B", frequency: 1 },
                { type: "O", frequency: 1 }
            ],
            frequency: 0.0044
        },
        {
            type: "sextuple",
            numStars: 6,
            numPlanetoids: { min: 0, max: 15 },
            starTypeFrequency: [
                { type: "M", frequency: 2 },
                { type: "K", frequency: 2 },
                { type: "G", frequency: 2 },
                { type: "F", frequency: 2 },
                { type: "A", frequency: 1 },
                { type: "B", frequency: 1 },
                { type: "O", frequency: 1 }
            ],
            frequency: 0.0024
        },
        {
            type: "septuple",
            numStars: 7,
            numPlanetoids: { min: 0, max: 15 },
            frequency: 0.0004,
            starTypeFrequency: [
                { type: "M", frequency: 1 },
                { type: "K", frequency: 1 },
                { type: "G", frequency: 1 },
                { type: "F", frequency: 1 },
                { type: "A", frequency: 1 },
                { type: "B", frequency: 1 },
                { type: "O", frequency: 1 }
            ]
        }
    ],

    // Types of binary stars with frequency
    binarySystemTypes: [
        {
            type: "closeDetached",
            frequency: 0.5
        },
        {
            type: "wide",
            frequency: 0.45
        },
        {
            type: "closeSemidetached",
            frequency: 0.04
        },
        {
            type: "closeContact",
            frequency: 0.01
        }
    ],

    // Type of star generated with frequency.
    starTypes: [
        {
            type: "M",
            mass: { min: 0.08 * SolM, max: 0.45 * SolM },
            radius: { min: 0.5 * SolR, max: 0.7 * SolR },

            frequency: 0.7645
        },
        {
            type: "K",
            mass: { min: 0.45 * SolM, max: 0.8 * SolM },
            radius: { min: 0.7 * SolR, max: 0.96 * SolR },

            frequency: 0.121
        },
        {
            type: "G",
            mass: { min: 0.8 * SolM, max: 1.04 * SolM },
            radius: { min: 0.96 * SolR, max: 1.15 * SolR },

            frequency: 0.076
        },
        {
            type: "F",
            mass: { min: 1.04 * SolM, max: 1.4 * SolM },
            radius: { min: 1.15 * SolR, max: 1.4 * SolR },

            frequency: 0.03
        },
        {
            type: "A",
            mass: { min: 1.4 * SolM, max: 2.1 * SolM },
            radius: { min: 1.4 * SolR, max: 1.8 * SolR },

            frequency: 0.006
        },
        {
            type: "B",
            mass: { min: 2.1 * SolM, max: 16 * SolM },
            radius: { min: 1.8 * SolR, max: 6.6 * SolR },

            frequency: 0.0013
        },
        {
            type: "O",
            mass: { min: 16 * SolM, max: 150 * SolM },
            radius: { min: 6.6 * SolR, max: 20 * SolR },

            frequency: 0.0000003
        }
    ],
    // Type of non-star body generated with frequency.
    // Zones?
    //  hot, habitable, icy, outer
    planetoidTypes: [
        {
            type: "smallRocky",
            mass: { min: 1e20, max: TerraM / 10, rng: "exponential" },
            density: { min: TerraD * 0.9, max: TerraD * 1.1 },

            numMoons: { min: 0, max: 5 },
            avgMoonMassRatio: 0.5,
            maxMoonMassRatio: 1,

            chanceOfRings: 0,

            frequency: 0.5
        },
        {
            type: "rocky",
            mass: { min: TerraM / 10, max: TerraM * 2, rng: "exponential" },
            density: { min: TerraD * 0.9, max: TerraD * 1.1 },

            numMoons: { min: 0, max: 5 },
            avgMoonMassRatio: 0.5,
            maxMoonMassRatio: 1,

            chanceOfRings: 0.05,
            ringMassRatio: { min: 0, max: 1e-7, rng: "exponential" },

            frequency: 0.3
        },
        {
            type: "superRocky",
            mass: { min: TerraM * 2, max: TerraM * 20, rng: "exponential" },
            density: { min: TerraD * 0.9, max: TerraD * 1.1 },

            numMoons: { min: 0, max: 8 },
            avgMoonMassRatio: 0.1,
            maxMoonMassRatio: 0.25,

            chanceOfRings: 0.3,
            ringMassRatio: { min: 0, max: 1e-7, rng: "exponential" },

            frequency: 0.03
        },
        // {
        //     type: "asteroid belt",
        //     mass: {min: TerraM*2, max: TerraM*20 },
        //     density: TerraD,

        //     frequency: 0
        // },
        {
            type: "gasGiant",
            mass: { min: TerraM * 2, max: TerraM * 300, rng: "exponential" },
            density: { min: 500, max: 1500 },

            numMoons: { min: 0, max: 10 },
            avgMoonMassRatio: 0.05,
            maxMoonMassRatio: 0.1,

            chanceOfRings: 0.6,
            ringMassRatio: { min: 0, max: 1e-7, rng: "exponential" },

            frequency: 0.08
        },
        {
            type: "superGasGiant",
            mass: { min: TerraM * 300, max: TerraM * 300 * 80, rng: "exponential" },
            density: { min: 1000, max: 80000 },

            numMoons: { min: 0, max: 20 },
            avgMoonMassRatio: 0.005,
            maxMoonMassRatio: 0.01,

            chanceOfRings: 0.8,
            ringMassRatio: { min: 0, max: 1e-7, rng: "exponential" },

            frequency: 0.03
        },
        {
            type: "iceGiant",
            mass: { min: TerraM * 2, max: TerraM * 20, rng: "exponential" },
            density: { min: 1250, max: 1750 },

            numMoons: { min: 0, max: 5 },
            avgMoonMassRatio: 0.1,
            maxMoonMassRatio: 0.25,

            chanceOfRings: 0.3,
            ringMassRatio: { min: 0, max: 1e-7, rng: "exponential" },

            // Should be exclusive to the zone
            // Zone: 1, 2, 3, 4

            frequency: 0.06
        }
    ],

    // Orbital Eccentricity
    eccentricityTypes: [
        {
            eccentricity: { min: 0, max: 0.01 },
            frequency: 2
        },
        {
            eccentricity: { min: 0.01, max: 0.1 },
            frequency: 8
        },
        {
            eccentricity: { min: 0.1, max: 0.25 },
            frequency: 2
        },
        {
            eccentricity: { min: 0.25, max: 0.75 },
            frequency: 0.1
        },
        {
            eccentricity: { min: 0.75, max: 1 },
            frequency: 0.001
        }
    ],
    // Orbital inclination
    inclinationTypes: [
        {
            inclination: { min: -1, max: 1 },
            frequency: 0.7
        },
        {
            inclination: { min: -5, max: 5 },
            frequency: 0.1
        },
        {
            inclination: { min: -10, max: 10 },
            frequency: 0.05
        },
        {
            inclination: { min: -45, max: 45 },
            frequency: 0.01
        },
        {
            inclination: { min: -90, max: 90 },
            frequency: 0.001
        }
    ]
};

interface RngVal {
    rng?:
        | "exponential"
        | "linear"
        | "normal"
        | "uniform"
        | RngAlgo
        | Array<"exponential" | "linear" | "normal" | "uniform" | RngAlgo>;
    min?: number;
    max?: number;
}
interface RngAlgo {
    type: "exponential" | "linear" | "normal" | "uniform";
    bias?: number;
}

// Improve this class for the future.
class RNG {
    seed: number;
    m_w: number;
    m_z: number;
    mask: number;

    constructor(seed?: string | number) {
        this.seed = this.computeRNGSeed(seed);

        this.m_w = this.seed;
        this.m_z = 987654321;
        this.mask = 0xffffffff;
    }
    computeRNGSeed(sSeed?: string | number) {
        if (typeof sSeed === "number") return Math.floor(sSeed);
        else if (!sSeed) return Math.random() * 1e17;
        const aSeed = Uint32Array.from(sSeed, (c) => c.codePointAt(0));

        let seed = 0;
        for (let x = 0; x < aSeed.length; x++) {
            seed = (seed << 5) - seed + aSeed[x];
            seed |= 0;
        }
        return seed;
    }

    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + this.m_w) & this.mask;
        result /= 4294967296;
        return result + 0.5;
    }
}

export default class SystemGenerator {
    seed: number;
    random: () => number;
    time: number;

    __id: number;

    constructor() {
        const rng = new RNG(21);
        this.seed = rng.seed;

        this.random = () => rng.random();

        this.time = Epoch + 1000000000000;
    }

    curveRandom(bias = 0.5, precision = 10) {
        let r = 0;
        for (let x = 0; x < precision; x++) r += Math.pow(this.random(), 0.5 / bias);
        return r / precision;
    }

    between(min: number, max: number, algorithm = this.random) {
        if (min == max) return min;
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }
        if (min == 0) return algorithm() * max;

        return min + algorithm() * (max - min);
    }
    betweenExp(min: number, max: number, algorithm = this.random) {
        if (min == max) return min;
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }

        let shift = 0;
        if (min < 0) {
            shift = min;
            max -= shift;
            min = 0;
        }

        if (min == 0) return Math.pow(10, algorithm() * Math.log10(max + 1)) - 1 + shift;

        if (max < 1) {
            return (
                1 /
                Math.pow(
                    10,
                    Math.log10(1 / min) + algorithm() * (Math.log10(1 / max) - Math.log10(1 / min))
                )
            );
        }

        return Math.pow(10, Math.log10(min) + algorithm() * (Math.log10(max) - Math.log10(min)));
    }

    getValue(val: number | RngVal) {
        if (typeof val === "object") {
            let between: (min: number, max: number, algorithm?: () => number) => number = null;
            let algorithm: (bias?: number, precision?: number) => number = null;
            let rng: Array<"exponential" | "linear" | "normal" | "uniform" | RngAlgo> = [];
            if (typeof val.rng !== "undefined") {
                if (val.rng instanceof Array) rng = val.rng.slice();
                else rng = [val.rng];
            }
            rng.forEach((r) => {
                if (typeof r !== "object") r = { type: r };
                switch (r.type) {
                    case "exponential": {
                        if (!between) between = this.betweenExp;
                        break;
                    }
                    case "linear": {
                        if (!between) between = this.between;
                        break;
                    }
                    case "normal": {
                        const bias = typeof r.bias === "number" ? r.bias : 0.5;
                        if (!algorithm) algorithm = this.curveRandom.bind(bias);
                        break;
                    }
                    case "uniform": {
                        if (!algorithm) algorithm = this.random;
                        break;
                    }
                }
            });
            // Defaults
            if (!between) between = this.between;
            if (!algorithm) algorithm = this.random;

            return between(val.min, val.max, algorithm);
        }
        return val;
    }

    choose<T extends FrequencyOpt>(opts: Array<T>): T {
        // First add all frequencies.
        let totalF = 0;
        for (let key in Object.keys(opts)) {
            totalF += opts[key].frequency;
        }

        // Roll
        const r = this.random() * totalF;
        let cur = 0;
        for (let key in Object.keys(opts)) {
            const f = opts[key].frequency;
            cur += f;

            if (r <= cur) return opts[key];
        }
    }

    generateId() {
        if (!this.__id) this.__id = 1;

        return this.__id++;
    }

    generateSystem(props: GenDef) {
        if (!props) props = DEFAULTS;
        else props = Object.assign({}, DEFAULTS, props);

        const createSystem = (numStars: number): SubSystem => {
            let position = vec3.create();
            let velocity = vec3.create();
            return {
                type: "subsystem",
                numStars: numStars,
                children: [] as Array<SubSystem | Star | Planetoid>,
                get mass() {
                    return this.children.reduce((p: number, c: Body) => p + c.mass, 0);
                },
                get radius() {
                    let maxRadius = 0;
                    for (let x = 0; x < this.children.length; x++) {
                        // Distance from parent + radius
                        const pos = vec3.create();
                        vec3.sub(pos, this.position, this.children[x].position);
                        let r = vec3.len(pos) + this.children[x].radius;
                        if (r > maxRadius) maxRadius = r;
                    }
                    return maxRadius;
                },
                get velocity() {
                    return velocity;
                },
                set velocity(val) {
                    if (!vec3.exactEquals(velocity, val)) {
                        // Grab difference
                        const diff = vec3.create();
                        vec3.subtract(diff, val, velocity);
                        // Update this system
                        velocity = val;
                        // Then all children
                        this.children.forEach((c: Orbital) => {
                            const vel = vec3.create();
                            vec3.add(vel, c.velocity, diff);
                            c.velocity = vel;
                        });
                    }
                },
                get position() {
                    return position;
                },
                set position(val) {
                    if (!vec3.exactEquals(position, val)) {
                        // Grab difference
                        const diff = vec3.create();
                        vec3.subtract(diff, val, position);
                        // Update this system
                        position = val;
                        // Then all children
                        this.children.forEach((c: Orbital) => {
                            const pos = vec3.create();
                            vec3.add(pos, c.position, diff);
                            c.position = pos;
                        });
                    }
                }
            } as SubSystem;
        };

        // Determine number of stars
        const sysType = this.choose(props.systemTypes);

        const system = createSystem(sysType.numStars);

        // Generate subsystems.
        const planetarySystems: Array<SubSystem> = [];
        {
            const pSysList = [system];

            while (pSysList.length > 0) {
                const sys = pSysList.shift();

                if (sys.numStars == 1) {
                    sys.subType = "star";
                    planetarySystems.push(sys);
                } else if (sys.numStars == 2) {
                    const binaryType = this.choose(props.binarySystemTypes);

                    const newSys1 = createSystem(1);
                    newSys1.subType = "star";

                    const newSys2 = createSystem(1);
                    newSys2.subType = "star";

                    if (binaryType.type == "wide") {
                        sys.subType = binaryType.type;

                        planetarySystems.push(newSys1);
                        planetarySystems.push(newSys2);
                        sys.children.push(newSys1);
                        sys.children.push(newSys2);
                    } else {
                        planetarySystems.push(sys);
                        const pairSys = createSystem(2);
                        pairSys.subType = binaryType.type;

                        pairSys.children.push(newSys1);
                        pairSys.children.push(newSys2);

                        sys.children.push(pairSys);
                    }
                } else if (sys.numStars > 2) {
                    // At least one star gets put into each subsystem.
                    const remainingStars = sys.numStars - 2;
                    const starDist = new Array(2);
                    for (let x = 0; x < starDist.length; x++) starDist[x] = 1;
                    for (let x = 0; x < remainingStars; x++)
                        starDist[Math.floor(this.between(0, starDist.length))]++;

                    starDist.forEach((s) => {
                        const newSys = createSystem(s);
                        if (s == 1) {
                            newSys.subType = "star";
                            planetarySystems.push(newSys);
                        } else {
                            pSysList.push(newSys);
                        }

                        sys.children.push(newSys);
                    });
                }
            }
        }

        // Now that we have all of our system and subsystems generated, determine
        // the stars
        const starList: Array<Star> = [];
        {
            const starTypes = props.starTypes.map((t) => {
                const st = Object.assign({}, t);
                if (sysType.starTypeFrequency) {
                    const sst = sysType.starTypeFrequency.find((f) => f.type == st.type);
                    if (sst) st.frequency = sst.frequency;
                }
                return st;
            });

            for (let x = 0; x < system.numStars; x++) {
                const starType = this.choose(starTypes);
                const star: Star = {
                    type: "star",
                    id: this.generateId(),
                    subType: starType.type,
                    mass: this.getValue(starType.mass),
                    radius: this.getValue(starType.radius),
                    density: 0,
                    children: []
                };
                star.density = star.mass / ((4 / 3) * Math.PI * Math.pow(star.radius, 3));

                starList.push(star);
            }

            // Assign
            let sX = 0;

            const assignStars = (sys: SubSystem) => {
                if (sys.numStars == 1) {
                    const star = starList[sX++];
                    sys.children.push(star);
                } else {
                    sys.children
                        .filter((s) => s.type == "subsystem")
                        .forEach((s) => assignStars(s as SubSystem));
                }
            };
            assignStars(system);

            // Rebalance the system, by making sure the branch with the most mass
            // before any others. All others can maintain order
            const balanceSystems = (sys: SubSystem | Star | Planetoid) => {
                if (sys.children.length >= 2) {
                    let max = 0;
                    let maxIndex: number | null = null;
                    sys.children.forEach((c, i) => {
                        if (maxIndex == null || max < c.mass) {
                            max = c.mass;
                            maxIndex = i;
                        }
                    });
                    const maxSys = sys.children[maxIndex];
                    sys.children.splice(maxIndex, 1);
                    sys.children.unshift(maxSys);

                    sys.children.forEach((s) => balanceSystems(s));
                }
            };
            balanceSystems(system);
        }

        // Determine total possible mass of planets
        const maxPlanetoidMass = system.mass * 0.01;

        // Once we have the stars, determine the planetoids.
        const planetoidList: Array<Planetoid> = [];
        {
            const planetoidTypes = props.planetoidTypes.map((t) => {
                const st = Object.assign({}, t);
                // Future pruning based on rules in system or sun?
                return st;
            });

            const numPlanetoids = Math.floor(this.getValue(sysType.numPlanetoids));
            let totalMass = 0;

            for (let x = 0; x < numPlanetoids; x++) {
                const bodyType = this.choose(planetoidTypes);
                const mass = this.getValue(bodyType.mass);
                const density = this.getValue(bodyType.density);
                const radius = Math.pow(mass / ((4 / 3) * Math.PI * density), 1 / 3);
                let maxMoonMass = this.between(
                    0,
                    bodyType.maxMoonMassRatio * mass,
                    this.curveRandom.bind(
                        this,
                        bodyType.avgMoonMassRatio / bodyType.maxMoonMassRatio
                    )
                );

                if (maxMoonMass < props.minGeneratedBodySize) maxMoonMass = 0;

                const numMoons = Math.min(
                    Math.floor(maxMoonMass / props.minGeneratedBodySize),
                    Math.floor(this.getValue(bodyType.numMoons))
                );
                if (numMoons == 0) maxMoonMass = 0;

                let ringMass =
                    bodyType.ringMassRatio &&
                    bodyType.chanceOfRings &&
                    this.random() <= bodyType.chanceOfRings
                        ? this.getValue(bodyType.ringMassRatio)
                        : 0;

                if (ringMass < 0) {
                    throw new Error("Ring mass is " + ringMass);
                }

                ringMass = ringMass * mass;

                const planetoid: Planetoid = {
                    type: "planet",
                    id: this.generateId(),
                    subType: bodyType.type,
                    numMoons: numMoons,
                    maxMoonMass: maxMoonMass,
                    ringMass: ringMass,
                    mass: mass,
                    density: density,
                    radius: radius,
                    children: []
                };
                planetoidList.push(planetoid);
                totalMass += planetoid.mass;

                // If our total mass exceeds our max, drop the largest planet.
                if (totalMass > maxPlanetoidMass) {
                    let max = 0;
                    let index = null;
                    for (let p = 0; p < planetoidList.length; p++) {
                        if (index == null || max < planetoidList[p].mass) {
                            max = planetoidList[p].mass;
                            index = x;
                        }
                    }
                    planetoidList.splice(index, 1);
                }
            }

            // Sort them into planetary systems.
            const unusedBodies = planetoidList.slice();
            unusedBodies.sort((b1, b2) => b2.mass - b1.mass);
            const planetMoonSystems: Array<Planetoid> = [];

            while (unusedBodies.length > 0) {
                // Give the biggest planets a chance at moons.
                const body = unusedBodies.splice(0, 1)[0];

                while (body.numMoons > 0 && unusedBodies.length > 0) {
                    const candidates = unusedBodies.filter((p) => p.mass <= body.maxMoonMass);
                    if (candidates.length > 0) {
                        const moon = candidates[Math.floor(this.random() * candidates.length)];
                        unusedBodies.splice(
                            unusedBodies.findIndex((b) => b == moon),
                            1
                        );
                        moon.numMoons = moon.maxMoonMass = 0;
                        moon.type = "moon";

                        if (!body.moons) body.moons = [];
                        body.moons.push(moon);
                        body.numMoons--;
                        body.maxMoonMass -= moon.mass;
                    } else break;
                }
                body.numMoons = body.moons && body.moons.length > 0 ? body.moons.length : 0;
                planetMoonSystems.push(body);
            }

            // Now assign each planet/moon system to a star
            for (let x = 0; x < planetMoonSystems.length; x++) {
                const index = Math.floor(this.between(0, planetarySystems.length));
                const planet = planetMoonSystems[x];
                if (planet.numMoons == 0) planetarySystems[index].children.push(planet);
                else {
                    const pSys = createSystem(0);
                    pSys.subType = "planet";
                    pSys.children.push(planet);

                    if (planet.moons) {
                        planet.moons.forEach((m) => pSys.children.push(m));
                        delete planet.moons;
                    }
                    delete planet.maxMoonMass;

                    planetarySystems[index].children.push(pSys);
                }
            }
        }

        // Determine position of each body from center of system
        let finalSystem = null;
        {
            // const isBinary = (sys) => {
            //     return sys.children.length == 2
            //         && (sys.subType == 'wide'
            //             || sys.subType == 'closeDetached'
            //             || sys.subType == 'closeSemidetached'
            //             || sys.subType == 'closeContact');
            //     };

            const calculateSystems = (
                sys: SubSystem | Star | Planetoid,
                parent?: SubSystem | Star | Planetoid
            ) => {
                // Go bottom up.
                if (sys.children) sys.children.forEach((c) => calculateSystems(c, sys));

                // If this is a leaf
                if (!sys.children) {
                    // Then relative to itself, it has 0 position and velocity.
                    sys.position = vec3.create();
                    sys.velocity = vec3.create();
                    sys.period = 0;
                    sys.eccentricity = 0;
                    sys.inclination = 0;
                    sys.apoapsis = 0;
                    sys.periapsis = 0;
                    sys.longitudeOfAscendingNode = 0;
                    sys.argumentOfPeriapsis = 0;
                    sys.meanAnomalyAtEpoch = 0;
                    sys.meanAnomaly = 0;
                }
                // If it is just one...
                else if (sys.children.length == 1) {
                    // Then the system doesn't need to exist.
                    if (parent) {
                        const index = parent.children.indexOf(sys);
                        parent.children.splice(index, 1, sys.children[0]);
                    } else {
                        sys = sys.children[0];
                    }
                }
                // If it is some kind of binary...
                else if (
                    sys.children.length == 2 &&
                    (sys.subType == "contact" ||
                        sys.subType == "closeDetached" ||
                        sys.subType == "closeSemidetached" ||
                        sys.subType == "wide")
                ) {
                    const body1 = sys.children[0];
                    const body2 = sys.children[1];

                    // TODO Calculate roche lobe sphere approximation
                    // A = orbital separation
                    // r1 = radius of M1
                    // q = M1/M2
                    // r1/A =  (0.49 * pow(q,2/3))/((0.6 * pow(q,2/3)) + ln(1 + pow(1,1/3)))

                    // For now just do 'wide', 'detatched', 'contact'
                    let dist = 0;
                    if (sys.subType == "contact") {
                        const r1 = body1.radius;
                        const r2 = body2.radius;
                        dist = this.between(Math.max(r1, r2), r1 + r2);
                    } else if (
                        sys.subType == "closeDetached" ||
                        sys.subType == "closeSemidetached"
                    ) {
                        const r1 = body1.radius;
                        const r2 = body2.radius;
                        dist = this.between(r1 + r2, 50 * (r1 + r2));
                    } else {
                        const r1 = body1.radius;
                        const r2 = body2.radius;
                        // TODO
                        // Binary distance appears to be a log normal distribution.
                        // Most have a period under 100 years. Max 1 LY.
                        dist = this.between(
                            50 * (r1 + r2),
                            LY,
                            this.curveRandom.bind(this, (100 * AU) / LY)
                        );
                    }

                    const m1 = body1.mass;
                    const m2 = body2.mass;

                    // Barycenters
                    const b1 = dist / (1 + m1 / m2);
                    const b2 = dist / (1 + m2 / m1);

                    if (typeof b1 === "undefined" || typeof b2 === "undefined")
                        throw "BAD BARYCENTER";

                    const eccentricity = this.getValue(
                        this.choose(props.eccentricityTypes).eccentricity
                    );
                    const inclination = this.getValue(
                        this.choose(props.inclinationTypes).inclination
                    );
                    const longitudeOfAscendingNode = this.between(0, 360); // Need to calculate this to determine the 'rotation' (z axis?) of the orbital plane if it is inclined. If not, use 0.
                    const argumentOfPeriapsis = this.between(0, 360); // Angle from reference plane to the periapsis.
                    const meanAnomalyAtEpoch = this.between(0, 360); // Position in orbit at the start of the epoch.

                    const period = 2 * Math.PI * Math.sqrt(Math.pow(b1 + b2, 3) / (G * (m1 + m2)));

                    body1.period = period;
                    body1.eccentricity = eccentricity;
                    body1.inclination = inclination;
                    body1.apoapsis = b1 * (1 + eccentricity);
                    body1.periapsis = b1 * (1 - eccentricity);
                    body1.longitudeOfAscendingNode = longitudeOfAscendingNode;
                    body1.argumentOfPeriapsis = argumentOfPeriapsis;
                    body1.meanAnomalyAtEpoch = meanAnomalyAtEpoch;
                    body1.meanAnomaly =
                        body1.meanAnomalyAtEpoch + (360 * (this.time - Epoch)) / period; // Current position (in degrees) of body in it's orbit.

                    body2.period = period;
                    body2.eccentricity = eccentricity;
                    body2.inclination = -inclination;
                    body2.apoapsis = b2 * (1 + eccentricity);
                    body2.periapsis = b2 * (1 - eccentricity);
                    body2.longitudeOfAscendingNode = longitudeOfAscendingNode;
                    body2.argumentOfPeriapsis = argumentOfPeriapsis + 180;
                    body2.meanAnomalyAtEpoch = meanAnomalyAtEpoch;
                    body2.meanAnomaly =
                        body2.meanAnomalyAtEpoch + (360 * (this.time - Epoch)) / period; // Current position (in degrees) of body in it's orbit.

                    this._calculateEularValues(body1);
                    this._calculateEularValues(body2);
                }
                // Any other system type requires us to generate a resonence
                // structure
                else {
                    // const sysMass = sys.mass;

                    // First body is the 'anchor' or parent body.
                    const anchor = sys.children[0];
                    // Rest are the satalites
                    const satallites = sys.children.slice(1);

                    // Calculate Roche limit for our min satellite distance,
                    // using our first satallite.
                    let min = 0;
                    for (let x = 0; x < satallites.length; x++) {
                        min = Math.max(
                            min,
                            1.26 *
                                satallites[x].radius *
                                Math.pow(anchor.mass / satallites[x].mass, 1 / 3)
                        );
                    }

                    // If this is a binary system that's being orbited, then the
                    // min needs to be large enough not to be disturbed by
                    // the orbiting stars.
                    const sysMin = anchor.radius * (anchor.type == "subsystem" ? 3 : 1);
                    min = Math.max(sysMin, min);
                    // min (or first orbit) should be between absolute min
                    // and 160x min (Mercury is ~80x min from sun).
                    min = this.between(min, min * 160, this.curveRandom.bind(this));

                    // Calculate resonence
                    const resonence = this.between(1.75, 2.25); // Sol is 2.

                    const totalVelocity = vec3.create();

                    const taPos = vec3.create();
                    vec3.copy(taPos, anchor.position);
                    const tempAnchor = {
                        position: taPos,
                        mass: anchor.mass,
                        apoapsis: 0,
                        periapsis: 0,
                        eccentricity: 0,
                        inclination: 0,
                        longitudeOfAscendingNode: 0,
                        argumentOfPeriapsis: 0,
                        meanAnomalyAtEpoch: 0,
                        meanAnomaly: 0
                    };

                    let t0 = 2 * Math.PI * Math.sqrt(Math.pow(min, 3) / (G * anchor.mass));
                    let r = 0;
                    for (let x = 0; x < satallites.length; x++) {
                        const satallite = satallites[x];

                        let period = 0;
                        let pDist = 0;
                        let hillDist = Number.MAX_VALUE;
                        const eccentricity = this.getValue(
                            this.choose(props.eccentricityTypes).eccentricity
                        );
                        let apoapsis = null;
                        let periapsis = null;
                        do {
                            // Keep cycling the period until we find one that the hill sphere
                            // fits into.
                            period = t0 * Math.pow(resonence, r);

                            // Introduce some random variation for flavor (up to 10%)
                            let deviation = (this.random() - this.random()) * ((r + 1) * 0.02);
                            period = period * (1 + deviation);

                            // Calculate Position
                            pDist = Math.pow(
                                (G * (tempAnchor.mass + satallite.mass) * period * period) /
                                    (4 * Math.PI * Math.PI),
                                1 / 3
                            );

                            apoapsis = pDist * (1 + eccentricity);
                            periapsis = pDist * (1 - eccentricity);

                            // If satallite is a sys, use reverse Hill sphere to
                            // determine min distance between our satallite sys and
                            // the 'anchor'.
                            if (
                                typeof satallite.children != "undefined" &&
                                satallite.children.length > 0
                            ) {
                                hillDist =
                                    pDist * Math.pow(satallite.mass / (3 * anchor.mass), 1 / 3);
                            }
                            r++;
                        } while (periapsis < hillDist || periapsis < min);

                        satallite.period = period;
                        satallite.apoapsis = apoapsis;
                        satallite.periapsis = periapsis;
                        satallite.eccentricity = eccentricity;
                        satallite.inclination = this.getValue(
                            this.choose(props.inclinationTypes).inclination
                        );
                        satallite.longitudeOfAscendingNode = this.between(0, 360); // Need to calculate this to determine the 'rotation' (z axis?) of the orbital plane if it is inclined. If not, use 0.
                        satallite.argumentOfPeriapsis = this.between(0, 360); // Angle from reference plane to the periapsis.
                        satallite.meanAnomalyAtEpoch = this.between(0, 360); // Position in orbit at the start of the epoch.
                        satallite.meanAnomaly =
                            satallite.meanAnomalyAtEpoch + (360 * (this.time - Epoch)) / period; // Current position (in degrees) of body in it's orbit.

                        this._calculateEularValues(satallite);
                    }

                    // Need to come up with a good way (n-body estimate) to
                    // determine the wobble of the anchor and apply that velocity
                    // and position.
                    // This may simply be an estimate using a virtual body that
                    // is an average of all the other bodies (but will likely be
                    // dominated by the largest).
                    anchor.velocity = totalVelocity;
                }
                return sys;
            };

            finalSystem = calculateSystems(system);
        }

        return finalSystem;
    }

    _calculateEularValues(body: Orbital) {
        const toRadians = (deg: number) => {
            return (deg / 180) * Math.PI;
        };

        const a = (body.apoapsis + body.periapsis) / 2;
        const ec = body.eccentricity;
        const i = body.inclination; // / 180 * Math.PI;
        const o0 = body.longitudeOfAscendingNode; // / 180 * Math.PI;
        const w0 = body.argumentOfPeriapsis; // / 180 * Math.PI;
        const m0 = body.meanAnomaly; // / 180 * Math.PI;

        // Eccentric anomaly
        // Make sure we have things in radians before we start.
        //
        const rM0 = toRadians(m0);
        let eca = rM0;
        while (true) {
            const dEca = (eca - ec * Math.sin(eca) + rM0) / (1 - ec * Math.cos(eca));
            eca -= dEca;
            if (Math.abs(dEca) < 0.000001) break;
        }

        const n = (2 * Math.PI) / body.period;

        const p = a * (Math.cos(eca) - ec);
        const q = a * Math.sin(eca) * Math.sqrt(1 - Math.pow(ec, 2));

        const vP = (-a * Math.sin(eca) * n) / (1 - ec * Math.cos(eca));
        const vQ =
            (a * Math.cos(eca) * Math.sqrt(1 - Math.pow(ec, 2)) * n) / (1 - ec * Math.cos(eca));

        const pos = vec3.fromValues(q, -p, 0);

        const rotQuat = quat.identity(quat.create());
        quat.rotateZ(rotQuat, rotQuat, -toRadians(w0));
        quat.rotateY(rotQuat, rotQuat, -toRadians(i));
        quat.rotateZ(rotQuat, rotQuat, -toRadians(o0));
        vec3.transformQuat(pos, pos, rotQuat);

        const vel = vec3.fromValues(-vQ, vP, 0);

        quat.identity(rotQuat);
        quat.rotateZ(rotQuat, rotQuat, -toRadians(w0));
        quat.rotateY(rotQuat, rotQuat, -toRadians(i));
        quat.rotateZ(rotQuat, rotQuat, -toRadians(o0));
        vec3.transformQuat(vel, vel, rotQuat);

        body.position = pos;
        body.velocity = vel;
    }
}

class PregeneratedSystem {
    system: SubSystem | Star | Planetoid;
    objects: { children: Array<Body> };
    constructor(system: SubSystem | Star | Planetoid) {
        this.system = system;

        let children: Array<Body> = [];
        let star = 0;
        let planet = 0;
        let moon = 0;
        const walk = (system: SubSystem | Star | Planetoid) => {
            if (system.type == "subsystem")
                system.children.forEach((c) => {
                    walk(c);
                });
            else {
                if (system.type == "star") {
                    star++;
                    planet = 0;
                }
                if (system.type == "planet") {
                    planet++;
                    moon = 0;
                }
                if (system.type == "moon") moon++;
                children.push(
                    new Body({
                        position: system.position,
                        velocity: system.velocity,
                        mass: system.mass,
                        radius: system.radius,
                        color:
                            system.type == "star"
                                ? "#f00"
                                : system.type == "planet"
                                  ? "#fff"
                                  : "#88f",
                        name:
                            system.type == "star"
                                ? `S${star}`
                                : system.type == "planet"
                                  ? `P${star}-${planet}`
                                  : system.type == "moon"
                                    ? `M${star}-${planet}-${moon}`
                                    : null
                    })
                );
            }
        };

        walk(system);

        this.objects = {
            children: children
        };
    }
}

export { PregeneratedSystem };
