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
uniform float glowStrength;
uniform float uTime;

vec3 hsl2rgb(float h)
{
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return 0.5 + 0.5 * rgb;
}

void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if(color.a <= 0.0)
    {
        gl_FragColor = vec4(0.0);
        return;
    }

    float wave = sin(vTextureCoord.x * 20.0 + vTextureCoord.y * 10.0 + uTime * 3.0);
    float hue = fract(wave * 0.5 + 0.5 + uTime * 0.15);
    vec3 shimmer = hsl2rgb(hue);

    vec3 result = mix(color.rgb, shimmer * color.a, glowStrength * 0.65);
    gl_FragColor = vec4(result, color.a);
}`;

export class HologramFilter extends NitroFilter
{
    constructor(strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
    }
}
