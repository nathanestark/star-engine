import { vec3 } from "gl-matrix";

export function formatVector(vector: vec3): string {
    return `(${vector[0]}, ${vector[1]}, ${vector[2]})`;
}
