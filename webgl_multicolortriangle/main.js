
var vertexShaderSource = `#version 300 es
in vec3 position;
in vec3 color;
out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 1.0);
}
`;

var fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
in vec3 vColor;
void main() {
    outColor = vec4(vColor, 1);
}
`;
const canvas = document.querySelector("canvas");
const gl = canvas.getContext('webgl2');
if(!gl){
    throw new Error('ERRO!');
}

const vertexData = [
    0,1,0,
    1,-1,0,
    -1,-1,0,
];
const colorData = [
    1,0,0,
    0,1,0,
    0,0,1,
];

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData),gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData),gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader,vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader,fragmentShaderSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program,vertexShader);
gl.attachShader(program,fragmentShader);
gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program,`position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,0,0);

const colorLocation = gl.getAttribLocation(program,`color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation,3,gl.FLOAT,false,0,0);

gl.useProgram(program);
gl.drawArrays(gl.TRIANGLES,0,3);
