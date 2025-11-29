import { GameObject } from "source/core";
import { UboDefinition, UboVariable, getUboDataTypeSize } from "./types";

export interface UboBindPointVariable {
    offset: number;
    size: number;
}
type UboVarMap = Record<string, UboBindPointVariable>;
export interface UboBindPoint {
    index: number;
    size: number;
    variables: UboVarMap;
}
type UboBindPointMap = Record<string, UboBindPoint>;

export class UboBindPointManager extends GameObject {
    private definitions: Array<UboDefinition>;
    private bindPoints: UboBindPointMap;
    private _size: number;

    constructor(definitions: Array<UboDefinition>) {
        super();

        this.definitions = definitions;

        this.bindPoints = {};
        this.compute();
    }

    static empty() {
        return new UboBindPointManager([]);
    }

    private compute() {
        // Reset first.
        this._size = 0;
        this.bindPoints = {};

        this.definitions.forEach(({ layout, name, variables }, index) => {
            let computeFn: (variables: Array<UboVariable>) => {
                definitionSize: number;
                variableSizes: UboVarMap;
            };
            if (!layout || layout === "std140") {
                computeFn = this.computeStd140.bind(this);
            } else {
                throw new Error(`Unrecognized layout type '${layout}'`);
            }

            const { definitionSize, variableSizes } = computeFn(variables);

            this._size += definitionSize;

            if (this.bindPoints[name] === undefined) {
                this.bindPoints[name] = {
                    size: definitionSize,
                    index: index,
                    variables: variableSizes
                };
            } else {
                throw new Error(`UboBindPoint name conflict: '${name}' is used twice.`);
            }
        }, this._size);
    }

    private computeStd140(variables: Array<UboVariable>): {
        definitionSize: number;
        variableSizes: UboVarMap;
    } {
        let definitionSize = 0;
        const variableSizes: UboVarMap = {};

        variables.forEach(({ name, dataType, length }) => {
            if (length === undefined) length = 1;

            const offset = definitionSize;
            const size = getUboDataTypeSize(dataType) * length;

            definitionSize += size;

            if (variableSizes[name] === undefined) {
                variableSizes[name] = {
                    offset,
                    size
                };
            } else {
                throw new Error(`UboVariable name conflict: '${name}' is used twice.`);
            }
        });
        return {
            definitionSize,
            variableSizes
        };
    }

    getBindPoint(name: string): UboBindPoint {
        const bindPoint = this.bindPoints[name];
        if (bindPoint === undefined) throw new Error(`UboChannel name '${name}' does not exist.`);

        return {
            ...bindPoint,
            variables: Object.entries(bindPoint.variables).reduce((variables, [key, value]) => {
                return {
                    ...variables,
                    [key]: { ...value }
                };
            }, {})
        };
    }
}
