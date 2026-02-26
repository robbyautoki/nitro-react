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
uniform float glowStrength;
uniform float uTime;

float colormap_red(float x)
{
    if(x < 0.0) return 54.0 / 255.0;
    else if(x < 20049.0 / 82979.0) return (829.79 * x + 54.51) / 255.0;
    else return 1.0;
}

float colormap_green(float x)
{
    if(x < 20049.0 / 82979.0) return 0.0;
    else if(x < 327013.0 / 810990.0) return (8546482679670.0 / 10875673217.0 * x - 2064961390770.0 / 10875673217.0) / 255.0;
    else if(x <= 1.0) return (103806720.0 / 483977.0 * x + 19607415.0 / 483977.0) / 255.0;
    else return 1.0;
}

float colormap_blue(float x)
{
    if(x < 0.0) return 54.0 / 255.0;
    else if(x < 7249.0 / 82979.0) return (829.79 * x + 54.51) / 255.0;
    else if(x < 20049.0 / 82979.0) return 127.0 / 255.0;
    else if(x < 327013.0 / 810990.0) return (792.022 * x - 64.365) / 255.0;
    else return 1.0;
}

vec3 colormap(float x)
{
    return vec3(colormap_red(x), colormap_green(x), colormap_blue(x));
}

float rand(vec2 n)
{
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p)
{
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);
    float res = mix(
        mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
        mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
}

float fbm(vec2 p)
{
    float f = 0.0;
    mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);
    f += 0.500000 * noise(p + uTime); p = mtx * p * 2.02;
    f += 0.031250 * noise(p); p = mtx * p * 2.01;
    f += 0.250000 * noise(p); p = mtx * p * 2.03;
    f += 0.125000 * noise(p); p = mtx * p * 2.01;
    f += 0.062500 * noise(p); p = mtx * p * 2.04;
    f += 0.015625 * noise(p + sin(uTime));
    return f / 0.96875;
}

float pattern(vec2 p)
{
    return fbm(p + fbm(p + fbm(p)));
}

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec2 uv = vTextureCoord * inputSize.xy / inputSize.x;
    float shade = pattern(uv);
    vec3 plasmaColor = colormap(shade);

    if(color.a > 0.0)
    {
        vec3 tinted = mix(color.rgb, plasmaColor * color.a, glowStrength * 0.5);
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
            float a = texture2D(uSampler, vTextureCoord + vec2(cos(angle), sin(angle)) * px * d).a;
            glow += a * weight;
            total += weight;
        }
    }
    glow /= total;

    float alpha = glow * glowStrength;
    gl_FragColor = vec4(plasmaColor * min(alpha * 2.0, 1.0), min(alpha * 2.0, 1.0));
}`;

export class PlasmaGlowFilter extends NitroFilter
{
    constructor(strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
        this.padding = 25;
    }
}
