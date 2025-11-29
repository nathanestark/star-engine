import { vec3 } from "gl-matrix";
import { Light, LightProperties } from "../light";

export interface PointLightProperties extends LightProperties {
    position: vec3;
}

export class PointLight extends Light {
    private _position: vec3;

    constructor({ position, ...props }: PointLightProperties) {
        super(props);

        this.classTags.push("point");

        this._position = position;
    }

    get position() {
        return this._position;
    }

    set position(value: vec3) {
        this._position = value;
        this.emitUpdated(true);
    }
}
