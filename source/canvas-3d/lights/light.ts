import { vec3 } from "gl-matrix";
import { GameObject, GameObjectEventTypes } from "source/core";

export interface LightEventTypes extends GameObjectEventTypes {
    updated: [light: Light];
}

export interface LightProperties {
    color: vec3;
    emitAutoUpdateEvents?: boolean;
}

export abstract class Light extends GameObject<LightEventTypes> {
    private _color: vec3;

    private emitAutoUpdateEvents: boolean;

    constructor({ color, emitAutoUpdateEvents }: LightProperties) {
        super();

        this.classTags = ["light"];
        this._color = color;
        this.emitAutoUpdateEvents = emitAutoUpdateEvents ?? true;
    }

    emitUpdated(isAutoEvent = false) {
        if (isAutoEvent && !this.emitAutoUpdateEvents) return;

        this.emit("updated", this);
    }

    get color() {
        return this._color;
    }

    set color(value: vec3) {
        this._color = value;
        this.emitUpdated(true);
    }
}
