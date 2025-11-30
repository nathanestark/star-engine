import { ShaderDef, Type } from "../types";

export default {
    type: Type.VERTEX_SHADER,
    attribVariables: [
        {
            name: "vertexPosition",
            target: "aVertexPosition"
        },
        {
            name: "vertexNormal",
            target: "aVertexNormal"
        },
        {
            name: "uv",
            target: "aUV"
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

      in vec3 aVertexPosition; // Doesn't need to be vec4. Use vec3
      in vec3 aVertexNormal;
      in vec2 aUV;
      in mat4 aModelMatrix;
            
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
