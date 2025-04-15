import { vec2 } from "gl-matrix";
import GameObject from "source/core/game-object";

export interface Size {
    width: number;
    height: number;
}

export interface GameObject2D extends GameObject {
    position: vec2;
    velocity: vec2;
    totalForce: vec2;
}
