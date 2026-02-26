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

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if(color.a > 0.0)
    {
        vec3 tinted = mix(color.rgb, glowColor * color.a, glowStrength * 0.2);
        gl_FragColor = vec4(tinted, color.a);
        return;
    }

    vec2 px = inputSize.zw;
    float glow = 0.0;
    float total = 0.0;

    for(float d = 1.0; d <= 8.0; d += 1.0)
    {
        float weight = (8.0 - d + 1.0) / 8.0;
        for(float angle = 0.0; angle < 6.28318; angle += 0.5236)
        {
            float a = texture2D(uSampler, vTextureCoord + vec2(cos(angle), sin(angle)) * px * d).a;
            glow += a * weight;
            total += weight;
        }
    }
    glow /= total;

    float pulse = 0.8 + 0.2 * sin(uTime * 3.0);
    float alpha = glow * glowStrength * pulse;

    gl_FragColor = vec4(glowColor * alpha, alpha * 0.9);
}`;

export class NeonGlowFilter extends NitroFilter
{
    constructor(color: [number, number, number], strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
        this.padding = 15;
    }
}
