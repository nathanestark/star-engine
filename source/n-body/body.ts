import { vec3 } from "gl-matrix";
import GameObject from "source/core/game-object";
import { RefreshTime } from "source/core/types";
import DefaultCamera from "./default-camera";
import FollowCamera from "./follow-camera";

const TWO_PI = 2 * Math.PI;

export interface BodyProperties {
    color?: string;
    radius?: number;
    position?: vec3;
    velocity?: vec3;
    mass?: number;
    name?: null | string;
}

export default class Body extends GameObject {
    color: string;
    radius: number;
    position: vec3;
    velocity: vec3;
    totalForce: vec3;
    mass: number;
    name: null | string;
    selected: boolean;
    maxSavedPositions: number;

    _lastPositions: Array<vec3>;
    removed: boolean;

    constructor({ color, radius, position, velocity, mass, name }: BodyProperties = {}) {
        super();
        this.classTags = ["body"];

        this.color = "#000";
        this.radius = 10;
        this.position = vec3.create();
        this.velocity = vec3.create();
        this.mass = 0;
        this.totalForce = vec3.create();
        this.name = null;
        this.selected = false;
        this.maxSavedPositions = 0;

        this._lastPositions = [];

        if (position) this.position = position;
        if (velocity) this.velocity = velocity;
        if (typeof mass == "number") this.mass = mass;
        if (typeof radius == "number") this.radius = radius;
        if (color) this.color = color;
        if (name) this.name = name;
    }

    update(tDelta: number) {
        // Save our last position
        if (this.maxSavedPositions > 0) {
            this._lastPositions.push(vec3.clone(this.position));
            if (this._lastPositions.length > this.maxSavedPositions)
                this._lastPositions.splice(0, 1);
        } else if (this._lastPositions.length > 0) this._lastPositions = [];

        // Apply our total force to our velocity.
        vec3.scale(this.totalForce, this.totalForce, tDelta / this.mass);
        vec3.add(this.velocity, this.velocity, this.totalForce);

        // Apply our velocity to our position, but don't destroy velocity.
        const vel = vec3.clone(this.velocity);
        vec3.scale(vel, vel, tDelta);
        vec3.add(this.position, this.position, vel);

        // Reset force.
        this.totalForce = vec3.create();
    }

    getPosition(pos: vec3, camera: DefaultCamera) {
        if (camera.view == "x") {
            return [pos[0], pos[1]];
        } else if (camera.view == "y") {
            return [pos[0], pos[2]];
        } else if (camera.view == "z") {
            return [-pos[1], pos[2]];
        }
        throw new Error("Invalid camera view.");
    }

    draw(camera: DefaultCamera, _time: RefreshTime) {
        camera.context.fillStyle = this.color;
        camera.context.beginPath();

        const pos = this.getPosition(this.position, camera);

        let doDraw = true;

        const drawRadius = this.radius * camera.objectScale;
        if (drawRadius * camera.zoom[0] < 0.5) {
            if (this.radius >= camera.minShowRadius || this.selected) {
                camera.context.arc(pos[0], pos[1], 0.5 / camera.zoom[0], 0, TWO_PI);
            } else doDraw = false;
        } else camera.context.arc(pos[0], pos[1], drawRadius, 0, TWO_PI);
        camera.context.fill();

        if (this.name) {
            camera.context.save();
            camera.context.resetTransform();

            let t1 =
                pos[0] * camera.zoom[0] +
                camera.size.width / 2 -
                camera.position[0] * camera.zoom[0];
            let t2 =
                pos[1] * camera.zoom[0] +
                camera.size.height / 2 -
                camera.position[1] * camera.zoom[0];

            // Offset it so it isn't right on top of our object.
            const offset = Math.max(1, this.radius * camera.zoom[0] * camera.objectScale);
            t1 += offset + 5;
            t2 += offset + 10;

            camera.context.fillStyle = "red";
            camera.context.lineWidth = 1;
            camera.context.font = "10px Tahoma";
            camera.context.fillText(this.name, t1, t2);
            camera.context.restore();
        }

        if (this.selected) {
            camera.context.beginPath();
            camera.context.lineWidth = 0.5 / camera.zoom[0];
            camera.context.strokeStyle = "#888";
            camera.context.rect(
                pos[0] - 5 / camera.zoom[0],
                pos[1] - 5 / camera.zoom[0],
                10 / camera.zoom[0],
                10 / camera.zoom[0]
            );
            camera.context.stroke();
        }

        if (doDraw && this._lastPositions.length > 0) {
            camera.context.strokeStyle = "#333";
            camera.context.lineWidth = 0.5 / camera.zoom[0];
            for (let x = 0; x < this._lastPositions.length; x++) {
                const point = vec3.clone(this._lastPositions[x]);
                const fCamera = camera as FollowCamera;
                if (fCamera.target) {
                    vec3.sub(point, point, fCamera.target._lastPositions[x]);
                    vec3.add(point, point, fCamera.target.position);
                }
                const point2D = this.getPosition(point, camera);
                if (x == 0) camera.context.moveTo(point2D[0], point2D[1]);
                else camera.context.lineTo(point2D[0], point2D[1]);
            }
            // Draw to object
            //context.lineTo(pos[0], pos[1]);

            camera.context.stroke();
        }
    }
}
