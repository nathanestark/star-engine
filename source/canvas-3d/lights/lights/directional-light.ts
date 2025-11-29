import { vec3 } from "gl-matrix";
import { Light, LightProperties } from "../light";

export interface DirectionalLightProperties extends LightProperties {
    direction: vec3;
}

export class DirectionalLight extends Light {
    private _direction: vec3;

    constructor({ direction, ...props }: DirectionalLightProperties) {
        super(props);

        this.classTags.push("directional");

        this._direction = direction;
    }

    get direction() {
        return this._direction;
    }

    set direction(value: vec3) {
        this._direction = value;
        this.emitUpdated(true);
    }
}
