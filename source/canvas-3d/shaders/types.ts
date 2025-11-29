export enum Type {
    FRAGMENT_SHADER,
    VERTEX_SHADER
}

export function getType(gl: WebGL2RenderingContext, type: Type) {
    switch (type) {
        case Type.FRAGMENT_SHADER:
            return gl.FRAGMENT_SHADER;
        case Type.VERTEX_SHADER:
            return gl.VERTEX_SHADER;
        default:
            throw new Error("Invalid Type");
    }
}

export interface Variable {
    name: string;
    target?: string;
}
export interface Block extends Variable {
    block: Array<string | Variable>;
}

export interface ShaderDef {
    source: string;
    attribVariables?: Array<string | Variable>;
    uniformVariables?: Array<string | Variable>;
    uniformBlocks?: Array<Block>;
    type: Type;
}

export interface UniformBlock extends Record<string, number> {
    index: number;
    size: number;
}
