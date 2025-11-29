import { Texture } from "./texture";
import { BindingPoint, Format, InternalFormat, Target, Type } from "./types";
import { Buffer } from "buffer";
function parseColor(color?: Uint8Array | string): Uint8Array {
    if (color instanceof Uint8Array) return color;

    if (/^#(:?[0-9a-f]{3,4}){1,2}$/gim.test(color as string)) {
        let hex = color.substring(1);
        if (hex.length == 3 || hex.length == 4) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
                .padEnd(8, "f");
            return Uint8Array.from(Buffer.from(hex, "hex"));
        }
    }

    // Bad string/no color
    return new Uint8Array([255, 255, 255, 255]);
}

export class ColorTexture extends Texture {
    constructor(color?: Uint8Array | string) {
        super({
            pixels: parseColor(color),
            bindingPoint: BindingPoint.TEXTURE_2D,
            target: Target.TEXTURE_2D,
            internalFormat: InternalFormat.RGBA,
            format: Format.RGBA,
            type: Type.UNSIGNED_BYTE
        });
    }
}
