import { vec3 } from "gl-matrix";
import { GameObject } from "source/core";
import { EventEmitter } from "events";

export interface LightProperties {
    color: vec3;
    emitAutoUpdateEvents?: boolean;
}

export abstract class Light extends GameObject {
    private _color: vec3;
    private emitter: EventEmitter = new EventEmitter();

    private emitAutoUpdateEvents: boolean;

    constructor({ color, emitAutoUpdateEvents }: LightProperties) {
        super();

        this.classTags = ["light"];
        this._color = color;
        this.emitAutoUpdateEvents = emitAutoUpdateEvents ?? true;
    }

    on<T extends Light>(event: "updated", listener: (light: T) => void) {
        this.emitter.on(event, listener);
    }
    off<T extends Light>(event: "updated", listener: (light: T) => void) {
        this.emitter.off(event, listener);
    }
    once<T extends Light>(event: "updated", listener: (light: T) => void) {
        this.emitter.once(event, listener);
    }
    emitUpdated(isAutoEvent = false) {
        if (isAutoEvent && !this.emitAutoUpdateEvents) return;

        this.emitter.emit("updated");
    }

    get color() {
        return this._color;
    }

    set color(value: vec3) {
        this._color = value;
        this.emitUpdated(true);
    }
}
