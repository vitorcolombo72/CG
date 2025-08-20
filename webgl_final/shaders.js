export var vertexShaderSource = `#version 300 es
in vec3 position;
uniform mat4 matrix;
void main() {
    gl_Position = matrix * vec4(position, 1.0);
}
`;

export var fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec3 color;
void main() {
    outColor = vec4(color, 1);
}
`;

export var fragmentShaderSourceGradient = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec3 color;
void main() {

  float t = gl_FragCoord.y / 1000.0; 


  vec3 gradientColor = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), t);
  
  outColor = vec4(gradientColor, 1.0);
}
`;