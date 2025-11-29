import { Texture } from "./texture";
import { BindingPoint, Format, InternalFormat, Target, Type } from "./types";

export class ImageTexture extends Texture {
    constructor(source: TexImageSource) {
        super({
            source,
            bindingPoint: BindingPoint.TEXTURE_2D,
            target: Target.TEXTURE_2D,
            internalFormat: InternalFormat.RGBA,
            format: Format.RGBA,
            type: Type.UNSIGNED_BYTE
        });
    }
}
