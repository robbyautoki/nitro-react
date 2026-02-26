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
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputSize;
uniform vec3 glowColor;
uniform float glowStrength;
uniform float uTime;

#define TAU 6.2831852
#define MOD3 vec3(.1031,.11369,.13787)

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

float simplex_noise(vec3 p)
{
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;

    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);

    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);

    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));

    return dot(vec4(31.316), n);
}

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec2 spriteSize = inputSize.xy;
    vec2 center = vec2(0.5);
    vec2 uv = (vTextureCoord - center) * vec2(spriteSize.x / spriteSize.y, 1.0);

    float a = sin(atan(uv.y, uv.x));
    float am = abs(a - 0.5) / 4.0;
    float l = length(uv) * 2.5;

    float m1 = clamp(0.1 / smoothstep(0.0, 1.75, l), 0.0, 1.0);
    float m2 = clamp(0.1 / smoothstep(0.42, 0.0, l), 0.0, 1.0);
    float s1 = (simplex_noise(vec3(uv * 2.0, 1.0 + uTime * 0.525)) * (max(1.0 - l * 1.75, 0.0)) + 0.9);
    float s2 = (simplex_noise(vec3(uv * 1.0, 15.0 + uTime * 0.525)) * (max(0.0 + l * 1.0, 0.025)) + 1.25);
    float s3 = (simplex_noise(vec3(vec2(am, am * 100.0 + uTime * 1.0) * 0.15, 30.0 + uTime * 0.525)) * (max(0.0 + l * 1.0, 0.025)) + 1.25);
    s3 *= smoothstep(0.0, 0.3345, l);

    float sh = smoothstep(0.15, 0.35, l);
    float sh2 = smoothstep(0.75, 0.3, l);

    float m = m1 * m2 * ((s1 * s2 * s3) * (1.0 - l)) * sh * sh2;
    m = m * m;

    if(color.a > 0.0)
    {
        vec3 tinted = mix(color.rgb, glowColor * color.a * m * 3.0, glowStrength * 0.45);
        gl_FragColor = vec4(tinted, color.a);
        return;
    }

    vec2 px = inputSize.zw;
    float glow = 0.0;
    float total = 0.0;

    for(float d = 1.0; d <= 12.0; d += 1.0)
    {
        float weight = (12.0 - d + 1.0) / 12.0;
        for(float angle = 0.0; angle < 6.28318; angle += 0.5236)
        {
            float sa = texture2D(uSampler, vTextureCoord + vec2(cos(angle), sin(angle)) * px * d).a;
            glow += sa * weight;
            total += weight;
        }
    }
    glow /= total;

    float auraAlpha = glow * glowStrength * m * 4.0;
    auraAlpha = min(auraAlpha, 1.0);
    gl_FragColor = vec4(glowColor * auraAlpha, auraAlpha);
}`;

export class AuraGlowFilter extends NitroFilter
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
