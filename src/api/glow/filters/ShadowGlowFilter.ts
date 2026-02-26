import { NitroFilter } from '@nitrots/nitro-renderer';

const vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 projectionMatrix;
varying vec2 vTextureCoord;
void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`;

const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputSize;
uniform vec3 glowColor;
uniform float glowStrength;
uniform float uTime;

float noise(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if(color.a > 0.0)
    {
        vec3 darkened = mix(color.rgb, glowColor * color.a, glowStrength * 0.3);
        gl_FragColor = vec4(darkened, color.a);
        return;
    }

    vec2 px = inputSize.zw;
    float glow = 0.0;
    float total = 0.0;

    for(float d = 1.0; d <= 12.0; d += 1.0)
    {
        float weight = (12.0 - d + 1.0) / 12.0;
        float noiseOffset = noise(vec2(d, uTime * 0.5)) * 0.3;
        for(float angle = 0.0; angle < 6.28318; angle += 0.5236)
        {
            vec2 offset = vec2(cos(angle + noiseOffset), sin(angle + noiseOffset)) * px * d;
            float a = texture2D(uSampler, vTextureCoord + offset).a;
            glow += a * weight;
            total += weight;
        }
    }
    glow /= total;

    float undulate = 0.85 + 0.15 * sin(uTime * 1.5 + vTextureCoord.x * 10.0);
    float alpha = glow * glowStrength * undulate;

    gl_FragColor = vec4(glowColor * alpha * 1.0, alpha * 0.95);
}`;

export class ShadowGlowFilter extends NitroFilter
{
    constructor(color: [number, number, number] = [0.1, 0.0, 0.15], strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
        this.padding = 25;
    }
}
