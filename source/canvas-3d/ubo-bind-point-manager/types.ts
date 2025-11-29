// prettier-ignore
export enum UboDataType {
    bool,
    int,
    uint,
    float,
    bvec2, bvec3, bvec4,
    ivec2, ivec3, ivec4,
    uvec2, uvec3, uvec4,
    vec2, vec3, vec4,
    mat2x2, mat2x3, mat2x4,
    mat3x2, mat3x3, mat3x4,
    mat4x2, mat4x3, mat4x4,

    mat2 = mat2x2,
    mat3 = mat3x3,
    mat4 = mat4x4
}

export function getUboDataTypeSize(dataType: UboDataType): number {
    switch (dataType) {
        case UboDataType.bool:
        case UboDataType.int:
        case UboDataType.uint:
        case UboDataType.float:
            return 4;
        case UboDataType.bvec2:
        case UboDataType.ivec2:
        case UboDataType.uvec2:
        case UboDataType.vec2:
            return 8;
        case UboDataType.mat2x2:
        case UboDataType.mat2x3:
        case UboDataType.mat2x4:
            return 32;
        case UboDataType.mat3x2:
        case UboDataType.mat3x3:
        case UboDataType.mat3x4:
            return 48;
        case UboDataType.mat4x2:
        case UboDataType.mat4x3:
        case UboDataType.mat4x4:
            return 64;
        // case UboDataType.bvec3:
        // case UboDataType.ivec3:
        // case UboDataType.uvec3:
        // case UboDataType.vec3:
        // case UboDataType.bvec4:
        // case UboDataType.ivec4:
        // case UboDataType.uvec4:
        // case UboDataType.vec4:
        default:
            return 16;
    }
}

export interface UboVariable {
    name: string;
    dataType: UboDataType;
    length?: number;
}

export interface UboDefinition {
    layout?: "std140";
    name: string;
    variables: Array<UboVariable>;
}
