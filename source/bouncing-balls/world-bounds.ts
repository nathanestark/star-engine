import { vec2 } from "gl-matrix";
import BoundingBoxCollider from "../canvas-2d/collision-detection/bounding-box-collider";
import GameObject from "source/core/game-object";
import { GameObject2D } from "source/canvas-2d/types";
import Canvas2DCamera from "source/canvas-2d/cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";
import { Collidable } from "source/canvas-2d/collision-detection/collider";

export interface WorldBoundsProperties {
    position?: vec2;
    size?: vec2;
    color?: string;
}

export default class WorldBounds extends GameObject implements GameObject2D, Collidable {
    position: vec2;
    velocity: vec2;
    totalForce: vec2;
    size: vec2;
    bounds: [vec2, vec2];
    color: string;
    _collider: BoundingBoxCollider;

    constructor({ position, size, color }: WorldBoundsProperties = {}) {
        super();
        this.classTags = ["world"];

        this.color = "#ccc";
        this.position = vec2.create();
        this.size = vec2.fromValues(1, 1);

        if (position) this.position = position;
        if (size) this.size = size;
        if (color) this.color = color;

        let pos1 = vec2.create();
        let pos2 = vec2.create();
        vec2.copy(pos1, this.position);
        vec2.add(pos2, this.position, this.size);
        this.bounds = [pos1, pos2];

        // Add a collider as a child.
        this._collider = new BoundingBoxCollider(this);
        this.children = [this._collider];
    }

    update() {
        // Make sure bounds is set correctly.
        vec2.copy(this.bounds[0], this.position);
        vec2.add(this.bounds[1], this.position, this.size);
    }

    draw(camera: Canvas2DCamera, _time: RefreshTime) {
        camera.context.strokeStyle = this.color;
        camera.context.lineWidth = 1 / camera.zoom[0];
        camera.context.strokeRect(this.position[0], this.position[1], this.size[0], this.size[1]);
    }
}
