import { vec3 } from "gl-matrix";
import { GameObject } from "source/core";
import {
    Format,
    InternalFormat,
    BindingPoint,
    Target,
    Type,
    getBindingPoint,
    getFormat,
    getInternalFormat,
    getTarget,
    getType
} from "./types";
import Canvas3DCamera from "../cameras/canvas-3d-camera";

export interface TextureProperties {
    level?: number;
    target: Target;
    internalFormat: InternalFormat;
    format: Format;
    type: Type;
    width?: number;
    height?: number;

    bindingPoint: BindingPoint;

    pixels?: ArrayBufferView<ArrayBufferLike> | null;
    source?: TexImageSource;
    pboOffset?: GLintptr;
    srcData?: ArrayBufferView<ArrayBufferLike>;
    srcOffset?: number;
}

export class Texture extends GameObject {
    private _glTexture?: WebGLTexture;

    private level: number;
    private target: Target;
    private internalFormat: InternalFormat;
    private format: Format;
    private type: Type;
    private width?: number;
    private height?: number;
    private border: number = 0;

    private bindingPoint: BindingPoint;

    private pixels?: ArrayBufferView<ArrayBufferLike> | null;
    private source?: TexImageSource;
    private pboOffset?: GLintptr;
    private srcData?: ArrayBufferView<ArrayBufferLike>;
    private srcOffset?: number;

    constructor({
        level = 0,
        target,
        internalFormat,
        format,
        type,
        width,
        height,
        bindingPoint,
        pixels,
        source,
        pboOffset,
        srcData,
        srcOffset = 0
    }: TextureProperties) {
        super();

        this.level = level;
        this.target = target;
        this.internalFormat = internalFormat;
        this.format = format;
        this.type = type;
        this.width = width;
        this.height = height;

        this.bindingPoint = bindingPoint;

        if (pixels) this.pixels = pixels;
        else if (source) this.source = source;
        else if (typeof pboOffset !== "undefined") this.pboOffset = pboOffset;
        else if (srcData) {
            this.srcData = srcData;
            this.srcOffset = srcOffset;
        } else {
            throw new Error("Invalid Texture - indeterminate structure");
        }
    }

    get glTexture() {
        if (!this._glTexture) throw new Error("Texture not initialized");

        return this._glTexture;
    }

    init({ context: gl }: Canvas3DCamera) {
        const glBindingPoint = getBindingPoint(gl, this.bindingPoint);
        const newTexture = gl.createTexture();
        gl.bindTexture(glBindingPoint, newTexture);
        this.buildTextImage2D(gl);
        // We're going to always generate a mipmap for simplicity.
        // This means a requirement for textures to be a power of 2.
        gl.generateMipmap(glBindingPoint);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this._glTexture = newTexture;
    }

    applyTexture(gl: WebGL2RenderingContext, uniformLocation: WebGLUniformLocation) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(getBindingPoint(gl, this.bindingPoint), this.glTexture);
        gl.uniform1i(uniformLocation, 0);
    }

    private buildTextImage2D(gl: WebGL2RenderingContext) {
        if (this.pixels) {
            gl.texImage2D(
                getTarget(gl, this.target),
                this.level,
                getInternalFormat(gl, this.internalFormat),
                this.width || 1,
                this.height || 1,
                this.border,
                getFormat(gl, this.format),
                getType(gl, this.type),
                this.pixels
            );
        } else if (this.source) {
            // Ignore 0 is fine.
            if (this.width || this.height) {
                gl.texImage2D(
                    getTarget(gl, this.target),
                    this.level,
                    getInternalFormat(gl, this.internalFormat),
                    this.width || 1,
                    this.height || 1,
                    this.border,
                    getFormat(gl, this.format),
                    getType(gl, this.type),
                    this.source
                );
            } else {
                gl.texImage2D(
                    getTarget(gl, this.target),
                    this.level,
                    getInternalFormat(gl, this.internalFormat),
                    getFormat(gl, this.format),
                    getType(gl, this.type),
                    this.source
                );
            }
        } else if (typeof this.pboOffset !== "undefined") {
            gl.texImage2D(
                getTarget(gl, this.target),
                this.level,
                getInternalFormat(gl, this.internalFormat),
                this.width || 1,
                this.height || 1,
                this.border,
                getFormat(gl, this.format),
                getType(gl, this.type),
                this.pboOffset
            );
        } else if (this.srcData) {
            gl.texImage2D(
                getTarget(gl, this.target),
                this.level,
                getInternalFormat(gl, this.internalFormat),
                this.width || 1,
                this.height || 1,
                this.border,
                getFormat(gl, this.format),
                getType(gl, this.type),
                this.srcData,
                this.srcOffset || 0
            );
        } else {
            throw new Error("Invalid Texture - indeterminate structure");
        }
    }
}
