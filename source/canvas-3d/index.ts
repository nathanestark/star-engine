import type { Size } from "./types";
import * as Math3D from "./math-3d";
import { formatVector } from "./format";
import Canvas3DCamera, { type Canvas3DCameraProperties } from "./cameras/canvas-3d-camera";

import {
    type ShaderDef,
    type Type as ShaderType,
    getType as getShaderType,
    vertexShader,
    fragmentShader,
    Shader
} from "./shaders";
import {
    type BindingPoint as TextureBindingPoint,
    getBindingPoint as getTextureBindingPoint,
    type InternalFormat as TextureInternalFormat,
    getInternalFormat as getTextureInteralFormat,
    type Format as TextureFormat,
    getFormat as getTextureFormat,
    type Target as TextureTarget,
    getTarget as getTextureTarget,
    type Type as TextureType,
    getType as getTextureType,
    Texture,
    type TextureProperties,
    ImageTexture,
    ColorTexture
} from "./textures";
import { Material, type MaterialProperties, type MaterialTexture } from "./materials";
import { Mesh, type MeshProperties } from "./meshes";
import { Model, type ModelProperties } from "./models";
import {
    LightManager,
    Light,
    type LightProperties,
    AmbientLight,
    type AmbientLightProperties,
    DirectionalLight,
    type DirectionalLightProperties,
    PointLight,
    type PointLightProperties
} from "./lights";

import { type BasicBuffers, initializeBasicBuffers, initializeBuffer } from "./renderable";
import { GameObject3D } from "./game-object-3d";

export {
    GameObject3D,
    Size,
    Math3D,
    formatVector,
    Canvas3DCamera,
    Canvas3DCameraProperties,
    ShaderDef,
    ShaderType,
    getShaderType,
    Shader,
    vertexShader,
    fragmentShader,
    BasicBuffers,
    initializeBasicBuffers,
    initializeBuffer,
    TextureBindingPoint,
    getTextureBindingPoint,
    TextureInternalFormat,
    getTextureInteralFormat,
    TextureFormat,
    getTextureFormat,
    TextureTarget,
    getTextureTarget,
    TextureType,
    getTextureType,
    Texture,
    TextureProperties,
    ImageTexture,
    ColorTexture,
    Material,
    MaterialProperties,
    MaterialTexture,
    Mesh,
    MeshProperties,
    Model,
    ModelProperties,
    LightManager,
    Light,
    LightProperties,
    AmbientLight,
    AmbientLightProperties,
    DirectionalLight,
    DirectionalLightProperties,
    PointLight,
    PointLightProperties
};
