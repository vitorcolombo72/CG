export const vertexShaderSourceAsteroid = `#version 300 es
in vec3 position;
uniform mat4 matrix;
out vec2 vUv;

void main() {
    gl_Position = matrix * vec4(position, 1.0);
    float u = 0.5 + atan(position.z, position.x) / (2.0 * 3.14159265);
    float v = 0.5 - asin(position.y) / 3.14159265;
    vUv = vec2(u, v);
}
`;

export const fragmentShaderSourceAsteroid = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;

#define INTENSITY 1.0
#define COUNT 100.0

vec2 Random(vec2 seed) {
    return fract(sin(vec2(
        dot(seed, vec2(127.1, 311.7)),
        dot(seed, vec2(269.5, 183.3))
    )) * 43758.5453);
}

float SmoothBlobKernel(vec2 U) {
    return smoothstep(0.2, 0.0, length(U));
}

void main() {
    vec2 U = vUv * uResolution;
    vec2 uv = U / uResolution.y;
    vec2 aspectRatio = uResolution / uResolution.y;

    vec4 sumColor = vec4(0.0);
    float sum = 0.0;
    float sumSquared = 0.0;

    for (float i = 0.0; i < COUNT; i++) {
        vec2 seed = vec2(i, i * 7.3);
        vec2 randOffset = Random(seed);

        float xOff = randOffset.x;
        vec2 spritePos = uv * xOff - randOffset * aspectRatio + 0.1 * cos(i + uTime + vec2(0, 1.6));
        spritePos.x += xOff * 0.5;

        float yOff = max(0.0, sin(uTime + i));
        spritePos.y += yOff;

        float kernel = SmoothBlobKernel(spritePos);
        vec4 tex = texture(uTexture, spritePos * 2.0) * INTENSITY;

        sumColor += tex * kernel;
        sum += kernel;
        sumSquared += kernel * kernel;
    }

    vec4 meanColor = texture(uTexture, uv * 2.0) * INTENSITY;
    fragColor = meanColor + (sumColor - sum * meanColor) / sqrt(sumSquared + 0.0001);
}
`;