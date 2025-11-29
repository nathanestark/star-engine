import { Camera, GameObject, RefreshTime } from "source/core";
import { Shader } from "../shaders";
import { ColorTexture, Texture } from "../textures";
import Canvas3DCamera from "../cameras/canvas-3d-camera";
import { MaterialTexture } from "./types";

export interface MaterialProperties {
    shader: Shader;
    textures: Array<MaterialTexture>;
}

export class Material extends GameObject {
    private shader: Shader;
    private textures: Array<MaterialTexture>;

    constructor({ shader, textures }: MaterialProperties) {
        super();

        this.avoidChildrenDrawing = true;

        this.shader = shader;
        this.textures = textures;
    }

    static createDefault(shader: Shader, color = "#888") {
        return new Material({
            shader,
            textures: [{ location: "texture", texture: new ColorTexture(color) }]
        });
    }

    get program() {
        return this.shader.program;
    }

    get attribLocations() {
        return this.shader.attribLocations;
    }

    get uniformLocations() {
        return this.shader.uniformLocations;
    }

    get uniformBlocks() {
        return this.shader.uniformBlocks;
    }

    apply(camera: Canvas3DCamera): void {
        const { context: gl } = camera;

        this.shader.use(gl);

        this.textures.forEach(({ location, texture }) =>
            texture.applyTexture(gl, this.shader.uniformLocations[location])
        );
    }
}
