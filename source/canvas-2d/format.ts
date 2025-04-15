import { vec2 } from "gl-matrix";

export function formatVector(vector: vec2): string {
    return `(${vector[0]}, ${vector[1]})`;
}
