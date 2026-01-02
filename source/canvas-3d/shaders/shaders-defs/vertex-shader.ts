import { ShaderDef, Type } from "../types";

export default {
    type: Type.VERTEX_SHADER,
    attribVariables: [
        {
            name: "vertexPosition",
            target: "aVertexPosition"
        },
        {
            name: "uv",
            target: "aUV"
        },
        {
            name: "vertexNormal",
            target: "aVertexNormal"
        },
        {
            name: "modelMatrix",
            target: "aModelMatrix"
        }
    ],
    uniformBlocks: [
        {
            name: "camera",
            target: "uboCamera",
            block: [
                {
                    name: "viewMatrix",
                    target: "uViewMatrix"
                },
                {
                    name: "projectionMatrix",
                    target: "uProjectionMatrix"
                }
            ]
        }
    ],
    source: `#version 300 es
      precision highp float;

      layout(location = 0) in vec3 aVertexPosition;
      layout(location = 1) in vec2 aUV;
      layout(location = 2) in vec3 aVertexNormal;
      layout(location = 3) in mat4 aModelMatrix;
            
      layout (std140) uniform uboCamera {
        mat4 uViewMatrix;
        mat4 uProjectionMatrix;
      };

      out highp vec3 vNormal;
      out highp vec3 vFragPos;
      out highp vec2 vUV;

      void main() {
        vec4 worldPos = aModelMatrix * vec4(aVertexPosition, 1);

        gl_Position = uProjectionMatrix * uViewMatrix * worldPos;

        vFragPos = worldPos.xyz;
        vNormal = normalize((aModelMatrix * vec4(aVertexNormal, 0)).xyz);
        vUV = aUV;
      }
    `
} as ShaderDef;
