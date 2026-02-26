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
    vec2 pixelCoord = vTextureCoord * inputSize.xy;

    vec2 cell = floor(pixelCoord / 6.0);
    float rnd = noise(cell);

    float isSparkle = step(0.82, rnd);

    float phase = rnd * 6.28318;
    float twinkle = pow(max(0.0, sin(uTime * 5.0 + phase)), 12.0);

    vec2 subPos = fract(pixelCoord / 6.0) - 0.5;
    float point = smoothstep(0.3, 0.0, length(subPos));

    float sparkleAlpha = isSparkle * twinkle * point * glowStrength;

    if(color.a > 0.0)
    {
        vec3 result = color.rgb + glowColor * sparkleAlpha * 1.5;
        gl_FragColor = vec4(result, color.a);
    }
    else
    {
        vec2 px = inputSize.zw;
        float nearEdge = 0.0;
        for(float angle = 0.0; angle < 6.28318; angle += 0.7854)
        {
            nearEdge += texture2D(uSampler, vTextureCoord + vec2(cos(angle), sin(angle)) * px * 3.0).a;
        }
        nearEdge = min(nearEdge, 1.0);

        float outerSparkle = sparkleAlpha * nearEdge;
        gl_FragColor = vec4(glowColor * outerSparkle, outerSparkle);
    }
}`;

export class SparkleFilter extends NitroFilter
{
    constructor(color: [number, number, number], strength: number = 0.9)
    {
        super(vertex, fragment);

        this.uniforms.glowColor = new Float32Array(color);
        this.uniforms.glowStrength = strength;
        this.uniforms.uTime = 0.0;
        this.padding = 5;
    }
}
