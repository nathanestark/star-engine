export default class SeededRNG {
    seed: number;
    m_w: number;
    m_z: number;
    mask: number;

    constructor(seed?: string | number) {
        this.seed = this.computeRNGSeed(seed);

        this.reset();
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

    /**
     * Resets our RNG values back to the starting point. For example,
     * calling `random(); random(); reset(); random(); random();` would
     * cause the result from the first two calls to be the same as the
     * results from the last two calls.
     */
    reset() {
        this.m_w = this.seed;
        this.m_z = 987654321;
        this.mask = 0xffffffff;
    }

    /**
     * Generates a random number, based on our seed, between 0 (inclusive)
     * and 1 (exclusive)
     * @returns A float between 0 and 1.
     */
    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + this.m_w) & this.mask;
        result /= 4294967296;
        return result + 0.5;
    }

    /**
     * Generates a random integer between 0 and 100, inclusive
     * @returns A random integer between 1 and 100, inclusive
     */
    range(): number;
    /**
     * Generate a random number between `to` and 100, inclusive.
     * @param to A number to act as the inclusive start point.
     * @returns A random number between `to` and 100, inclusive. If `to` is an integer,
     *          the resulting number will be an integer. Otherwise, it could be a float.
     */
    range(to: number): number;
    /**
     * Generate a random number between `to` and `from`, inclusive.
     * @param from A number to act as the inclusive start point.
     * @param to A number to act as the inclusive end point.
     * @returns A random number between `to` and `from`, inclusive. If both `to` and `from`
     *          are integers, the resulting number will be an integer. Otherwise, it could
     *          be a float.
     */
    range(from: number, to: number): number;
    /**
     * Generate a random number between `to` and `from`, inclusive.
     * @param rng An object defining `to`, `from` and `int`. Each property is optional,
     *            with the following defaults:
     *              `to`: 0
     *              `from`: 100
     *              `int`: true, if both `to` and `from` are integers.
     * @returns A random number between `to` and `from`, inclusive. If `int` is true, or if
     *          both `to` and `from` are integers, the resulting number will be an integer.
     *          Otherwise, it could be a float.
     */
    range(rng: { from?: number; to?: number; int?: boolean }): number;
    range(rng?: number | { from?: number; to?: number; int?: boolean }, to?: number): number {
        // Normalize params.
        if (typeof rng === "undefined") rng = {};
        else if (typeof rng === "number") {
            rng = typeof to === "undefined" ? { to: rng } : { from: rng, to: to };
        }
        const nRng = { from: 0, to: 100, ...rng };
        if (typeof nRng.int === "undefined")
            nRng.int = Number.isInteger(nRng.from) && Number.isInteger(nRng.to);

        const raw = this.random() * (nRng.to - nRng.from);
        return (nRng.int ? Math.round(raw) : raw) + nRng.from;
    }

    /**
     * Generates a random value between 1 and 6, inclusive (1d6)
     * @returns Integer between 1 and 6, inclusive
     */
    roll(): number;
    /**
     * Generates an inclusive value as dictates by the TdS+A formula, where
     * T is the total number of dice, S is the size of each die, and A is any
     * additional values to add to the result. T, S and A may only be integers.
     * For example, "1d6", "2d4", "1d8+2". 'x' can be used instead of 'd', and
     * all whitespace is stripped. If T is omitted, 'd' may also be omitted, and
     * 'T' is assumed to be `1`.
     * @param dice A string representing the formula to roll. For example:
     *             "1d6", "2d4", "1d8+2", "1x6", "d2", "10", "10+1"
     * @returns The resulting integer.
     */
    roll(dice: string): number;
    /**
     * Generates a random value between 1 and `size`, inclusive (1d`size`). Size
     * may be a float.
     * @param size The size of the die to roll
     * @returns The resulting number. If `size` is an integer, the result will be
     *          an integer.
     */
    roll(size: number): number;
    /**
     * Generates a random value between `total` and `size`*`total`, inclusive
     * (`total`d`size`, for example 2d4). Either `size` or `total` may be a float.
     * @param total The total number of dice to roll
     * @param size The size of the dice to roll
     * @returns The resulting number. If `size` and `total` are both integers, the
     *          result will be an integer.
     */
    roll(total: number, size: number): number;
    /**
     * Generates a random value between `total`+`add` and `size`*`total`+`add`, inclusive
     * (`total`d`size`+`add`, for example 2d4+1). Either `size`, `total` or `add` may be a float.
     * @param total The total number of dice to roll
     * @param size The size of the dice to roll
     * @param add The amount to add after the dice roll
     * @returns The resulting number. If `size`, `total` and `add` are integers, the
     *          result will be an integer.
     */
    roll(total: number, size: number, add: number): number;
    /**
     * Generates a random value between `total`+`add` and `size`*`total`+`add`, inclusive
     * (`total`d`size`+`add`, for example 2d4+1). Either `size`, `total` or `add` may be a float.
     * If `int` is true, the result will be forced to be an integer using `Math.round`.
     * @param dice An object defining `total`, `size`, `add` and `int`, as
     *             `total`: The total number of dice to roll
     *             `size`: The size of the dice to roll
     *             `add`: The amount to add after the dice roll
     *             Each property is optional with the following defaults.
     *             `total`: 1
     *             `size`: 6
     *             `add`: 0
     *             `int`: true, if `total`, `size`, and `add` are all integers
     * @returns The resulting number. If `size`, `total` and `add` are integers, the
     *          result will be an integer.
     */
    roll(dice: { total?: number; size?: number; add?: number; int?: boolean }): number;
    roll(
        dice?: string | number | { total?: number; size?: number; add?: number; int?: boolean },
        size?: number,
        add?: number
    ): number {
        // Normalize params.
        if (typeof dice === "undefined") dice = {};
        else if (typeof dice === "number") {
            dice =
                typeof size === "undefined"
                    ? { size: dice }
                    : { total: dice, size, ...(typeof add === "undefined" ? {} : { add }) };
        } else if (typeof dice === "string") {
            const { total, size, add } =
                /^\s*(?<total>\d+)??\s*(d|x)?\s*(?<size>\d+)\s*([+]\s*(?<add>\d+))?$/gi.exec(
                    dice
                ).groups;
            const nTotal = parseInt(total);
            const nSize = parseInt(size);
            const nAdd = parseInt(add);
            dice = {
                ...(Number.isNaN(nTotal) ? {} : { total: nTotal }),
                ...(Number.isNaN(nSize) ? {} : { size: nSize }),
                ...(Number.isNaN(nAdd) ? {} : { add: nAdd })
            };
        }
        const nDice: { total: number; size: number; add: number; int: boolean } = {
            total: 1,
            size: 6,
            add: 0,
            int: true,
            ...dice
        };
        if (typeof dice.int === "undefined")
            nDice.int =
                Number.isInteger(nDice.total) &&
                Number.isInteger(nDice.size) &&
                Number.isInteger(nDice.add);

        const raw = this.range(nDice.total, nDice.total * nDice.size);
        return raw + (nDice.int ? Math.round(nDice.add) : nDice.add);
    }
}
