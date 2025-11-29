import { ShaderDef, Type } from "../types";

export default {
    type: Type.FRAGMENT_SHADER,
    uniformVariables: [
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
    ],
    source: `
      precision highp float;

      varying highp vec2 vUV;
      varying highp vec3 vNormal;
      varying highp vec3 vFragPos;

      uniform sampler2D uSampler;

      uniform highp vec3 uAmbientLight;
      uniform highp int uDLightCount;
      uniform highp vec3 uDLightDirections[8];
      uniform highp vec3 uDLightColors[8];

      void main() {
        highp vec4 texelColor = texture2D(uSampler, vUV);
        
        vec3 normal = normalize(vNormal);

        vec3 totalLight = uAmbientLight;

        for (int i = 0; i < 8; i++) {
            if (i >= uDLightCount) break;

            vec3 lightDir = normalize(uDLightDirections[i]);
            float diff = max(dot(normal, lightDir), 0.0);

            totalLight += diff * uDLightColors[i];
        }

        gl_FragColor = vec4(texelColor.rgb * totalLight, texelColor.a);
      }
    `
} as ShaderDef;
