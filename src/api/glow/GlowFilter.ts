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
uniform float distance;

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if(color.a > 0.0)
    {
        vec3 tinted = mix(color.rgb, glowColor * color.a, glowStrength * 0.25);
        gl_FragColor = vec4(tinted, color.a);
        return;
    }

    vec2 px = inputSize.zw * distance;
    float glow = 0.0;
    float total = 0.0;

    for(float angle = 0.0; angle < 6.28318; angle += 0.5236)
    {
        for(float d = 1.0; d <= 3.0; d += 1.0)
        {
            vec2 offset = vec2(cos(angle), sin(angle)) * px * d;
            float a = texture2D(uSampler, vTextureCoord + offset).a;
            float weight = 1.0 / d;
            glow += a * weight;
            total += weight;
        }
    }
    glow /= total;

    if(glow > 0.01)
    {
        gl_FragColor = vec4(glowColor * glow * glowStrength, glow * glowStrength * 0.8);
    }
    else
    {
        gl_FragColor = vec4(0.0);
    }
}`;

export class GlowFilter extends NitroFilter
{
    constructor(color: [number, number, number], strength: number = 0.8, dist: number = 2.0)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.distance = dist;
        this.padding = Math.ceil(dist) * 3;
    }

    get glowStrength(): number
    {
        return this.uniforms.glowStrength;
    }

    set glowStrength(v: number)
    {
        this.uniforms.glowStrength = v;
    }
}
