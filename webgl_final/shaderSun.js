
export const vertexShaderSourceSun = `#version 300 es
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
export const fragmentShaderSourceSun = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D noiseTexture;
uniform float time;
uniform vec2 resolution;

out vec4 outColor;

void main() {
    float t = time;


    float scale = 1.0 + 0.2 * sin(t * 3.0);
    vec2 uv = vUv * scale + vec2(t * 0.1, t * 0.05);


    vec3 noise1 = texture(noiseTexture, uv).rgb;
    vec3 noise2 = texture(noiseTexture, uv * 2.0 - vec2(t * 0.2, 0.1)).rgb;
    vec3 noise3 = texture(noiseTexture, uv * 0.5 + vec2(-t * 0.05, 0.3)).rgb;

    vec3 noise = (noise1 + noise2 * 0.5 + noise3 * 0.25);

 
    vec3 baseColor = vec3(1.0, 0.4, 0.0);

    vec3 color = baseColor + noise * 0.5;
    color = pow(color, vec3(1.2, 1.1, 1.0));
    outColor = vec4(color, 1.0);
}
`;