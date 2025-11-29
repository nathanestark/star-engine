import { EventEmitter as CoreEventEmitter } from "events";

export type EventMap = Record<string, any[]>;

export default class EventEmitter<E extends EventMap> {
    private readonly emitter = new CoreEventEmitter();

    on<K extends keyof E>(event: K, listener: (...args: E[K]) => void): this {
        this.emitter.on(event as string, listener);
        return this;
    }

    once<K extends keyof E>(event: K, listener: (...args: E[K]) => void): this {
        this.emitter.once(event as string, listener);
        return this;
    }

    off<K extends keyof E>(event: K, listener: (...args: E[K]) => void): this {
        this.emitter.off(event as string, listener);
        return this;
    }

    protected emit<K extends keyof E>(event: K, ...args: E[K]): boolean {
        return this.emitter.emit(event as string, ...args);
    }
}
