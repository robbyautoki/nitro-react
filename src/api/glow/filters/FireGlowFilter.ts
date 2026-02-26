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

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;
    for(int i = 0; i < 3; i++)
    {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if(color.a > 0.0)
    {
        float heat = fbm(vTextureCoord * inputSize.xy * 0.05 + vec2(0.0, -uTime * 2.0));
        vec3 fireColor = mix(glowColor, vec3(1.0, 0.9, 0.2), heat);
        vec3 tinted = mix(color.rgb, fireColor * color.a, glowStrength * 0.5);
        gl_FragColor = vec4(tinted, color.a);
        return;
    }

    vec2 px = inputSize.zw;
    float edgeAlpha = 0.0;
    float total = 0.0;

    for(float d = 1.0; d <= 10.0; d += 1.0)
    {
        float weight = (10.0 - d + 1.0) / 10.0;
        for(float angle = 0.0; angle < 6.28318; angle += 0.5236)
        {
            float a = texture2D(uSampler, vTextureCoord + vec2(cos(angle), sin(angle)) * px * d).a;
            edgeAlpha += a * weight;
            total += weight;
        }
    }
    edgeAlpha /= total;

    vec2 flameUV = vTextureCoord * inputSize.xy * 0.04;
    flameUV.y -= uTime * 3.0;
    float flame = fbm(flameUV);

    float flicker = 0.7 + 0.3 * noise(vec2(uTime * 8.0, 0.0));
    float alpha = edgeAlpha * flame * glowStrength * 2.5 * flicker;
    vec3 fireColor = mix(glowColor, vec3(1.0, 0.9, 0.2), flame);

    gl_FragColor = vec4(fireColor * alpha, alpha);
}`;

export class FireGlowFilter extends NitroFilter
{
    constructor(color: [number, number, number], strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
        this.padding = 25;
    }
}
