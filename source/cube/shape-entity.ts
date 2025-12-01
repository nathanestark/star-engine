import { quat, vec3 } from "gl-matrix";
import GameObject from "source/core/game-object";
import DefaultCamera from "./default-camera";
import { RefreshTime } from "source/core/types";
import { GameObject3D, Mesh, Model } from "source/canvas-3d";

export interface ShapeEntityProperties {
    position?: vec3;
    center?: vec3;
    velocity?: vec3;
    rotation?: quat;
    pivot?: vec3;
    scale?: vec3;
    mass?: number;
    mesh?: Mesh;
}

export default class ShapeEntity extends GameObject implements GameObject3D {
    velocity: vec3;
    totalForce: vec3;
    mass: number;
    model: Model;

    minSpeed: number;

    constructor({
        position,
        center,
        velocity,
        rotation,
        pivot,
        scale,
        mass,
        mesh
    }: ShapeEntityProperties = {}) {
        super();

        this.classTags = ["shape"];
        this.avoidChildrenDrawing = true;

        this.model = new Model({ mesh, position, center, rotation, pivot, scale });
        this.children = [this.model];

        this.mass = 1;
        this.velocity = vec3.create();
        this.totalForce = vec3.create();

        if (velocity) this.velocity = velocity;
        if (typeof mass == "number") this.mass = mass;
    }

    get position(): vec3 {
        return this.model.position;
    }
    set position(value: vec3) {
        this.model.position = value;
    }

    get center(): vec3 {
        return this.model.center;
    }
    set center(value: vec3) {
        this.model.center = value;
    }

    get rotation(): quat {
        return this.model.rotation;
    }
    set rotation(value: quat) {
        this.model.rotation = value;
    }

    get pivot(): vec3 {
        return this.model.pivot;
    }
    set pivot(value: vec3) {
        this.model.pivot = value;
    }

    get scale(): vec3 {
        return this.model.scale;
    }
    set scale(value: vec3) {
        this.model.scale = value;
    }

    update(time: RefreshTime): void {
        // Apply our total force to our velocity.
        vec3.scale(this.totalForce, this.totalForce, time.timeAdvance / this.mass);
        vec3.add(this.velocity, this.velocity, this.totalForce);

        let sqrSpeed = vec3.sqrLen(this.velocity);
        // Check if our velocity falls below epsilon.
        if (sqrSpeed <= Math.pow(this.minSpeed, 2)) {
            vec3.set(this.velocity, 0, 0, 0);
            sqrSpeed = 0;
        }

        // Apply our velocity to our position, but don't destroy velocity.
        if (sqrSpeed > 0) {
            const vel = vec3.clone(this.velocity);
            vec3.scale(vel, vel, time.timeAdvance);
            vec3.add(this.position, this.position, vel);
            if (Number.isNaN(this.position[0])) {
                throw "Bad position";
            }
        }
        // Reset force.
        this.totalForce = vec3.create();

        // Spin
        quat.rotateX(this.rotation, this.rotation, 0.01);
        quat.rotateY(this.rotation, this.rotation, 0.008);
        quat.rotateZ(this.rotation, this.rotation, 0.005);
    }

    draw(camera: DefaultCamera, time: RefreshTime) {
        this.model.draw(camera, time);
    }
}
