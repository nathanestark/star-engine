import { ShaderDef, UniformBlock } from "./types";
import { fragmentShader, vertexShader } from "./shaders-defs";
import { GameObject } from "source/core";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { UboBindPointManager } from "../ubo-bind-point-manager";
import { getShaderType } from "..";

export interface ShaderProperties {
    shaders: Array<ShaderDef>;
    bindPointManager: UboBindPointManager;
}

export class Shader extends GameObject {
    private shaders: Array<ShaderDef>;
    private bindPointManager: UboBindPointManager;

    private _program?: WebGLProgram;
    private _attribLocations: Record<string, number>;
    private _uniformLocations: Record<string, WebGLUniformLocation>;
    private _uniformBlocks: Record<string, UniformBlock>;

    constructor({ shaders, bindPointManager }: ShaderProperties) {
        super();
        if (!shaders?.length) throw new Error("Must provide at minimum 1 ShaderDef");

        this.shaders = shaders;
        this.bindPointManager = bindPointManager;
    }

    static createBasicShader(bindPointManager: UboBindPointManager) {
        return new Shader({
            shaders: [vertexShader, fragmentShader],
            bindPointManager
        });
    }

    get program() {
        if (!this._program) throw new Error("Shader not initialized");

        return this._program;
    }

    get attribLocations() {
        if (!this._attribLocations) throw new Error("Shader not initialized");

        return this._attribLocations;
    }

    get uniformLocations() {
        if (!this._uniformLocations) throw new Error("Shader not initialized");

        return this._uniformLocations;
    }

    get uniformBlocks() {
        if (!this._uniformBlocks) throw new Error("Shader not initialized");

        return this._uniformBlocks;
    }

    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
    }

    init({ context: gl }: Canvas3DCamera) {
        if (!this.shaders?.length) return;

        const newProgram = gl.createProgram();
        this.shaders.forEach((shader) => {
            const glShader = gl.createShader(getShaderType(gl, shader.type));
            gl.shaderSource(glShader, shader.source);
            gl.compileShader(glShader);
            // Should we be throwing here?
            if (!gl.getShaderParameter(glShader, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(glShader));

            gl.attachShader(newProgram, glShader);
        });

        gl.linkProgram(newProgram);
        // Should we be throwing here?
        if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(newProgram));

        gl.useProgram(newProgram);

        // link up variables locations and return
        const {
            attribLocations: newAttribLocations,
            uniformLocations: newUniformLocations,
            uniformBlocks: newUniformBlocks
        } = this.shaders.reduce(
            (info, shader) => {
                const attribLocations = (shader.attribVariables || []).reduce(
                    (variables, variable) => {
                        let name = variable as string;
                        let target = variable as string;
                        if (variable instanceof Object) {
                            name = variable.name;
                            target = variable.target ?? name;
                        }
                        return {
                            ...variables,
                            [name]: gl.getAttribLocation(newProgram, target)
                        };
                    },
                    info.attribLocations
                );

                const uniformLocations = (shader.uniformVariables || []).reduce(
                    (variables, variable) => {
                        let name = variable as string;
                        let target = variable as string;
                        if (variable instanceof Object) {
                            name = variable.name;
                            target = variable.target ?? name;
                        }
                        return {
                            ...variables,
                            [name]: gl.getUniformLocation(newProgram, target)
                        };
                    },
                    info.uniformLocations
                );

                const uniformBlocks = (shader.uniformBlocks || []).reduce(
                    (variables, { name, target: vTarget, block }) => {
                        const target = vTarget ?? name;

                        const index = gl.getUniformBlockIndex(newProgram, target);
                        const size = gl.getActiveUniformBlockParameter(
                            newProgram,
                            index,
                            gl.UNIFORM_BLOCK_DATA_SIZE
                        );

                        // Verify bind point
                        const bindPoint = this.bindPointManager.getBindPoint(name);
                        if (!bindPoint) {
                            throw new Error(
                                `Binding Point for '${name}' was not found in UboBindPointManager`
                            );
                        } else if (bindPoint.size !== size) {
                            throw new Error(
                                `Size for Binding Point '${name}' (${size}) does not match size in UboBindPointManager (${bindPoint.size})`
                            );
                        }

                        gl.uniformBlockBinding(newProgram, index, bindPoint.index);

                        const normalizedBlock: Array<{ name: string; target: string }> = block.map(
                            (blockVariable) => {
                                let blockName = blockVariable as string;
                                let blockTarget = blockVariable as string;
                                if (blockVariable instanceof Object) {
                                    blockName = blockVariable.name;
                                    blockTarget = blockVariable.target ?? blockName;
                                }
                                return {
                                    name: blockName,
                                    target: blockTarget
                                };
                            }
                        );

                        const indices = gl.getUniformIndices(
                            newProgram,
                            normalizedBlock.map((block) => block.target)
                        );
                        const offsets = gl.getActiveUniforms(
                            newProgram,
                            indices,
                            gl.UNIFORM_OFFSET
                        );
                        const blocks = normalizedBlock.reduce(
                            (block, variable, i) => ({
                                ...block,
                                [variable.name]: offsets[i]
                            }),
                            { index, size } as UniformBlock
                        );

                        return {
                            ...variables,
                            [name]: blocks
                        };
                    },
                    info.uniformBlocks
                );

                return {
                    ...info,
                    attribLocations,
                    uniformLocations,
                    uniformBlocks
                };
            },
            { attribLocations: {}, uniformLocations: {}, uniformBlocks: {} }
        );

        this._attribLocations = newAttribLocations;
        this._uniformLocations = newUniformLocations;
        this._uniformBlocks = newUniformBlocks;
        this._program = newProgram;
    }
}
