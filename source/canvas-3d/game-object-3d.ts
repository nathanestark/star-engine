import { vec3 } from "gl-matrix";
import { GameObject } from "source/core";

export class GameObject3D extends GameObject {
    position: vec3;
    velocity: vec3;
    totalForce: vec3;
}
