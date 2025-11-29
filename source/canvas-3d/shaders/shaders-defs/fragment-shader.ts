import { ShaderDef, Type } from "../types";

export default {
    type: Type.FRAGMENT_SHADER,
    uniformVariables: [
        {
            name: "texture",
            target: "uTexture"
        }
    ],
    uniformBlocks: [
        {
            name: "lighting",
            target: "uboLighting",
            block: [
                {
                    name: "ambientLight",
                    target: "uAmbientLight"
                },
                {
                    name: "directionalLightCount",
                    target: "uDLightCount"
                },
                {
                    name: "directionalLightDirections",
                    target: "uDLightDirections"
                },
                {
                    name: "directionalLightColors",
                    target: "uDLightColors"
                }
            ]
        }
    ],
    source: `#version 300 es
      precision highp float;

      in highp vec2 vUV;
      in highp vec3 vNormal;
      in highp vec3 vFragPos;

      out vec4 vFragColor;

      uniform sampler2D uTexture;

      layout (std140) uniform uboLighting {
        vec3 uAmbientLight;
        vec3 uDLightDirections[8];
        vec3 uDLightColors[8];
        int uDLightCount;
      };

      void main() {
        highp vec4 texelColor = texture(uTexture, vUV);
        
        vec3 normal = normalize(vNormal);

        vec3 totalLight = uAmbientLight;

        for (int i = 0; i < 8; i++) {
            if (i >= uDLightCount) break;

            vec3 lightDir = normalize(uDLightDirections[i]);
            float diff = max(dot(normal, lightDir), 0.0);

            totalLight += diff * uDLightColors[i];
        }

        vFragColor = vec4(texelColor.rgb * totalLight, texelColor.a);
      }
    `
} as ShaderDef;
