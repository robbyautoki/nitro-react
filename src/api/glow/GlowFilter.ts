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

    if(color.a <= 0.0)
    {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec2 px = inputSize.zw * distance;
    float edgeFactor = 0.0;
    float samples = 0.0;

    for(float angle = 0.0; angle < 6.28318; angle += 0.7854)
    {
        vec2 offset = vec2(cos(angle), sin(angle)) * px;
        float a = texture2D(uSampler, vTextureCoord + offset).a;
        edgeFactor += (1.0 - a);
        samples += 1.0;
    }
    edgeFactor /= samples;

    float strength = glowStrength * (0.3 + 0.7 * edgeFactor);
    vec3 glowed = mix(color.rgb, glowColor * color.a, strength);
    gl_FragColor = vec4(glowed, color.a);
}`;

export class GlowFilter extends NitroFilter
{
    constructor(color: [number, number, number], strength: number = 0.8, dist: number = 2.0)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.distance = dist;
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
