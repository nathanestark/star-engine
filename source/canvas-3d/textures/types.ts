export enum BindingPoint {
    TEXTURE_2D,
    TEXTURE_CUBE_MAP,
    TEXTURE_3D,
    TEXTURE_2D_ARRAY
}

export function getBindingPoint(gl: WebGL2RenderingContext, bindingPoint: BindingPoint): number {
    switch (bindingPoint) {
        case BindingPoint.TEXTURE_CUBE_MAP:
            return gl.TEXTURE_CUBE_MAP;
        case BindingPoint.TEXTURE_3D:
            return gl.TEXTURE_3D;
        case BindingPoint.TEXTURE_2D_ARRAY:
            return gl.TEXTURE_2D_ARRAY;
        case BindingPoint.TEXTURE_2D:
        default:
            return gl.TEXTURE_2D;
    }
}

export enum Target {
    TEXTURE_2D,
    TEXTURE_CUBE_MAP_POSITIVE_X,
    TEXTURE_CUBE_MAP_NEGATIVE_X,
    TEXTURE_CUBE_MAP_POSITIVE_Y,
    TEXTURE_CUBE_MAP_NEGATIVE_Y,
    TEXTURE_CUBE_MAP_POSITIVE_Z,
    TEXTURE_CUBE_MAP_NEGATIVE_Z
}

export function getTarget(gl: WebGL2RenderingContext, target: Target): number {
    switch (target) {
        case Target.TEXTURE_CUBE_MAP_POSITIVE_X:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        case Target.TEXTURE_CUBE_MAP_NEGATIVE_X:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
        case Target.TEXTURE_CUBE_MAP_POSITIVE_Y:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
        case Target.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
        case Target.TEXTURE_CUBE_MAP_POSITIVE_Z:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
        case Target.TEXTURE_CUBE_MAP_NEGATIVE_Z:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
        case Target.TEXTURE_2D:
        default:
            return gl.TEXTURE_2D;
    }
}

export enum InternalFormat {
    RGB,
    RGBA,
    LUMINANCE_ALPHA,
    LUMINANCE,
    ALPHA,
    R8,
    R8_SNORM,
    R16F,
    R32F,
    R8UI,
    R8I,
    R16UI,
    R16I,
    R32UI,
    R32I,
    RG8,
    RG8_SNORM,
    RG16F,
    RG32F,
    RG8UI,
    RG8I,
    RG16UI,
    RG16I,
    RG32UI,
    RG32I,
    RGB8,
    SRGB8,
    RGB565,
    RGB8_SNORM,
    R11F_G11F_B10F,
    RGB9_E5,
    RGB16F,
    RGB32F,
    RGB8UI,
    RGB8I,
    RGB16UI,
    RGB16I,
    RGB32UI,
    RGB32I,
    RGBA8,
    SRGB8_ALPHA8,
    RGBA8_SNORM,
    RGB5_A1,
    RGBA4,
    RGB10_A2,
    RGBA16F,
    RGBA32F,
    RGBA8UI,
    RGBA8I,
    RGBA16UI,
    RGBA16I,
    RGBA32UI,
    RGBA32I,
    DEPTH_COMPONENT16,
    DEPTH_COMPONENT24,
    DEPTH_COMPONENT32F,
    DEPTH24_STENCIL8,
    DEPTH32F_STENCIL8
}

export function getInternalFormat(
    gl: WebGL2RenderingContext,
    internalFormat: InternalFormat
): number {
    switch (internalFormat) {
        case InternalFormat.RGB:
            return gl.RGB;
        case InternalFormat.LUMINANCE_ALPHA:
            return gl.LUMINANCE_ALPHA;
        case InternalFormat.LUMINANCE:
            return gl.LUMINANCE;
        case InternalFormat.ALPHA:
            return gl.ALPHA;
        case InternalFormat.R8:
            return gl.R8;
        case InternalFormat.R8_SNORM:
            return gl.R8_SNORM;
        case InternalFormat.R16F:
            return gl.R16F;
        case InternalFormat.R32F:
            return gl.R32F;
        case InternalFormat.R8UI:
            return gl.R8UI;
        case InternalFormat.R8I:
            return gl.R8I;
        case InternalFormat.R16UI:
            return gl.R16UI;
        case InternalFormat.R16I:
            return gl.R16I;
        case InternalFormat.R32UI:
            return gl.R32UI;
        case InternalFormat.R32I:
            return gl.R32I;
        case InternalFormat.RG8:
            return gl.RG8;
        case InternalFormat.RG8_SNORM:
            return gl.RG8_SNORM;
        case InternalFormat.RG16F:
            return gl.RG16F;
        case InternalFormat.RG32F:
            return gl.RG32F;
        case InternalFormat.RG8UI:
            return gl.RG8UI;
        case InternalFormat.RG8I:
            return gl.RG8I;
        case InternalFormat.RG16UI:
            return gl.RG16UI;
        case InternalFormat.RG16I:
            return gl.RG16I;
        case InternalFormat.RG32UI:
            return gl.RG32UI;
        case InternalFormat.RG32I:
            return gl.RG32I;
        case InternalFormat.RGB8:
            return gl.RGB8;
        case InternalFormat.SRGB8:
            return gl.SRGB8;
        case InternalFormat.RGB565:
            return gl.RGB565;
        case InternalFormat.RGB8_SNORM:
            return gl.RGB8_SNORM;
        case InternalFormat.R11F_G11F_B10F:
            return gl.R11F_G11F_B10F;
        case InternalFormat.RGB9_E5:
            return gl.RGB9_E5;
        case InternalFormat.RGB16F:
            return gl.RGB16F;
        case InternalFormat.RGB32F:
            return gl.RGB32F;
        case InternalFormat.RGB8UI:
            return gl.RGB8UI;
        case InternalFormat.RGB8I:
            return gl.RGB8I;
        case InternalFormat.RGB16UI:
            return gl.RGB16UI;
        case InternalFormat.RGB16I:
            return gl.RGB16I;
        case InternalFormat.RGB32UI:
            return gl.RGB32UI;
        case InternalFormat.RGB32I:
            return gl.RGB32I;
        case InternalFormat.RGBA8:
            return gl.RGBA8;
        case InternalFormat.SRGB8_ALPHA8:
            return gl.SRGB8_ALPHA8;
        case InternalFormat.RGBA8_SNORM:
            return gl.RGBA8_SNORM;
        case InternalFormat.RGB5_A1:
            return gl.RGB5_A1;
        case InternalFormat.RGBA4:
            return gl.RGBA4;
        case InternalFormat.RGB10_A2:
            return gl.RGB10_A2;
        case InternalFormat.RGBA16F:
            return gl.RGBA16F;
        case InternalFormat.RGBA32F:
            return gl.RGBA32F;
        case InternalFormat.RGBA8UI:
            return gl.RGBA8UI;
        case InternalFormat.RGBA8I:
            return gl.RGBA8I;
        case InternalFormat.RGBA16UI:
            return gl.RGBA16UI;
        case InternalFormat.RGBA16I:
            return gl.RGBA16I;
        case InternalFormat.RGBA32UI:
            return gl.RGBA32UI;
        case InternalFormat.RGBA32I:
            return gl.RGBA32I;
        case InternalFormat.DEPTH_COMPONENT16:
            return gl.DEPTH_COMPONENT16;
        case InternalFormat.DEPTH_COMPONENT24:
            return gl.DEPTH_COMPONENT24;
        case InternalFormat.DEPTH_COMPONENT32F:
            return gl.DEPTH_COMPONENT32F;
        case InternalFormat.DEPTH24_STENCIL8:
            return gl.DEPTH24_STENCIL8;
        case InternalFormat.DEPTH32F_STENCIL8:
            return gl.DEPTH32F_STENCIL8;
        case InternalFormat.RGBA:
        default:
            return gl.RGBA;
    }
}

export enum Format {
    RED,
    RG,
    RGB,
    RGBA,
    LUMINANCE_ALPHA,
    LUMINANCE,
    ALPHA,
    RED_INTEGER,
    RG_INTEGER,
    RGB_INTEGER,
    RGBA_INTEGER,
    DEPTH_COMPONENT,
    DEPTH_STENCIL
}

export function getFormat(gl: WebGL2RenderingContext, format: Format): number {
    switch (format) {
        case Format.RED:
            return gl.RED;
        case Format.RG:
            return gl.RG;
        case Format.RGB:
            return gl.RGB;
        case Format.LUMINANCE_ALPHA:
            return gl.LUMINANCE_ALPHA;
        case Format.LUMINANCE:
            return gl.LUMINANCE;
        case Format.ALPHA:
            return gl.ALPHA;
        case Format.RED_INTEGER:
            return gl.RED_INTEGER;
        case Format.RG_INTEGER:
            return gl.RG_INTEGER;
        case Format.RGB_INTEGER:
            return gl.RGB_INTEGER;
        case Format.RGBA_INTEGER:
            return gl.RGBA_INTEGER;
        case Format.DEPTH_COMPONENT:
            return gl.DEPTH_COMPONENT;
        case Format.DEPTH_STENCIL:
            return gl.DEPTH_STENCIL;
        case Format.RGBA:
        default:
            return gl.RGBA;
    }
}

export enum Type {
    BYTE,
    UNSIGNED_BYTE,
    SHORT,
    UNSIGNED_SHORT,
    UNSIGNED_SHORT_5_6_5,
    UNSIGNED_SHORT_4_4_4_4,
    UNSIGNED_SHORT_5_5_5_1,
    INT,
    UNSIGNED_INT,
    UNSIGNED_INT_10F_11F_11F_REV,
    UNSIGNED_INT_5_9_9_9_REV,
    UNSIGNED_INT_2_10_10_10_REV,
    UNSIGNED_INT_24_8,
    HALF_FLOAT,
    FLOAT,
    FLOAT_32_UNSIGNED_INT_24_8_REV
}

export function getType(gl: WebGL2RenderingContext, type: Type): number {
    switch (type) {
        case Type.BYTE:
            return gl.BYTE;
        case Type.SHORT:
            return gl.SHORT;
        case Type.UNSIGNED_SHORT:
            return gl.UNSIGNED_SHORT;
        case Type.UNSIGNED_SHORT_5_6_5:
            return gl.UNSIGNED_SHORT_5_6_5;
        case Type.UNSIGNED_SHORT_4_4_4_4:
            return gl.UNSIGNED_SHORT_4_4_4_4;
        case Type.UNSIGNED_SHORT_5_5_5_1:
            return gl.UNSIGNED_SHORT_5_5_5_1;
        case Type.INT:
            return gl.INT;
        case Type.UNSIGNED_INT_10F_11F_11F_REV:
            return gl.UNSIGNED_INT_10F_11F_11F_REV;
        case Type.UNSIGNED_INT_5_9_9_9_REV:
            return gl.UNSIGNED_INT_5_9_9_9_REV;
        case Type.UNSIGNED_INT_2_10_10_10_REV:
            return gl.UNSIGNED_INT_2_10_10_10_REV;
        case Type.UNSIGNED_INT_24_8:
            return gl.UNSIGNED_INT_24_8;
        case Type.HALF_FLOAT:
            return gl.HALF_FLOAT;
        case Type.FLOAT:
            return gl.FLOAT;
        case Type.FLOAT_32_UNSIGNED_INT_24_8_REV:
            return gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
        case Type.UNSIGNED_SHORT_5_6_5:
            return gl.UNSIGNED_SHORT_5_6_5;
        case Type.UNSIGNED_BYTE:
        default:
            return gl.UNSIGNED_BYTE;
    }
}
