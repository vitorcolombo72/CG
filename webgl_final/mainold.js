console.log('mat4:', typeof mat4);
// o tam serve para controlar o tamanho dos pontos no shader
// como os pontos principais e o de controle tem tamanho maior que
// os pontos que formam a linha
// o matrix é a matriz de transformação da porra toda
// translação,scale,rotation e camera e o caralho a 4
var vertexShaderSource = `#version 300 es
in vec3 position;
in vec3 color;
out vec3 vColor;
uniform mat4 matrix;
uniform float tam;
void main() {
    vColor = color;
    gl_Position = matrix * vec4(position, 1.0);
    gl_PointSize = tam; // tamanho do ponto (em pixels)
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
// Buffer de cores para os pontos
let color1 = [
    0.5,0.2,0.4,
    0.5,0.2,0.4,
    0.5,0.2,0.4,
    0.5,0.2,0.4,
];
// Buffer de cores para os pontos de controle
let color2 = [
    0.3,0.2,0.9,
    0.3,0.2,0.9,
    0.3,0.2,0.9,
];
//Data de posições dos pontos 
let vertexData = [
    -0.8,-0.8,0.5,
    -0.4,0.4,0.5,
    0.1,0.3,0.5,
    0.5,0.5,0.5,
    
];
//Data de posições dos pontos de controle
let controlData = [
    -0.9, 0.1,0.5,
    -0.2, -0.3,0.5,
    -0.5,0.9,0.5,
];
// midPoints calcula as posições de todos os pontos de todas as linhas
// esses valores são usados para desenhar os pontos e depois para calcular mover a camera
// implementado de forma bruta, daria pra corrigir pra permitir mais pontos
// assim como acima, daria pra permitir que mais pontos principais,de controle e portanto mais linhas
// FAZER DEPOIS 
let midPoints = [];
for (let t = 0; t <= 1.01; t += 0.001){
        let x = (1-t)**2*vertexData[0] + 2*(1-t)*t*controlData[0] + t*t*vertexData[3];
        let y = (1-t)**2*vertexData[1] + 2*(1-t)*t*controlData[1] + t*t*vertexData[4];
        midPoints.push(x,y,0.5);
    }
    
for (let t = 0; t <= 1.01; t += 0.001){
        let x = (1-t)**2*vertexData[3] + 2*(1-t)*t*controlData[3] + t*t*vertexData[6];
        let y = (1-t)**2*vertexData[4] + 2*(1-t)*t*controlData[4] + t*t*vertexData[7];
        midPoints.push(x,y,0.5);
}
for (let t = 0; t <= 1.01; t += 0.001){
        let x = (1-t)**2*vertexData[6] + 2*(1-t)*t*controlData[6] + t*t*vertexData[9];
        let y = (1-t)**2*vertexData[7] + 2*(1-t)*t*controlData[7] + t*t*vertexData[10];
        midPoints.push(x,y,0.5);
}
// esse é o vetor que calcula as movimentações da camera e usa o midpoints
// a movimentação é a diferença da proxima posição para a atual
// a camera nunca mexe, quem mexe são os objetos
let diffPoints = [];
for(let l = 0; l < midPoints.length; l+=3){
    let x = midPoints[l+3] - midPoints[l];
    let y = midPoints[l+1+3] - midPoints[l+1];
    diffPoints.push(x,y);
}
//console.log(diffPoints);
// Não usei, daria pra usar
// gera 3 cores aleatorias
function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}


// cria e binda o positionBuffer com o vertexData
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData),gl.STATIC_DRAW);

//cria e binda o colorBuffer com o color1
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color1),gl.STATIC_DRAW);

//cria e compila vertex shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader,vertexShaderSource);
gl.compileShader(vertexShader);
console.log(gl.getShaderInfoLog(vertexShader));

//cria e compila fragment shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader,fragmentShaderSource);
gl.compileShader(fragmentShader);
console.log(gl.getShaderInfoLog(fragmentShader));

//programa é a combinação dos shaders, é o que é utilziado pelo webgl2
const program = gl.createProgram();
gl.attachShader(program,vertexShader);
gl.attachShader(program,fragmentShader);
gl.linkProgram(program);

// esta indicando ao webgl2 de onde retirar as posições para fazer o desenho
const positionLocation = gl.getAttribLocation(program,`position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,0,0);

// esta indicando ao webgl2 de onde retirar as cores para fazer o desenho
const colorLocation = gl.getAttribLocation(program,`color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation,3,gl.FLOAT,false,0,0);

//qual programa usar e habilitar o negocio que corrige os problemas de profundiade
gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

// uniformLocations guarda as localizações dos uniforms usados no shader.
// "uniforms" são variáveis que têm o mesmo valor para todos os vértices ou fragmentos em uma chamada de renderização.
// Neste caso, usamos os uniforms "matrix" (matriz de transformação) e "tam" (tamanho dos pontos).
const uniformLocations = {
    matrix: gl.getUniformLocation(program,`matrix`),
    tam: gl.getUniformLocation(program,`tam`),
};

const modelMatrix = mat4.create(); //modelMatrix é a matriz de rotação, translação e scale
const viewMatrix = mat4.create(); //viewMatrix é a matriz da camera
const projectionMatrix = mat4.create();//projectionMatrix é a matriz de perspectiva
mat4.perspective(projectionMatrix,
    75 * Math.PI/180,
    canvas.width/canvas.height,
    1e-4,
    1e4
);
const mvMatrix = mat4.create(); //matriz intermediaria apenas para calculos
const mvpMatrix = mat4.create(); //matriz final M*V*P = Model,View,Projection
mat4.translate(modelMatrix,modelMatrix,[0.8,0.8,0.2]); // translatando primeiramente
mat4.translate(viewMatrix,viewMatrix,[-0.8,-0.8,3]); // mexendo na camera primeiro
mat4.invert(viewMatrix,viewMatrix); //inverte pois a camera necessita disso
mat4.multiply(mvMatrix,viewMatrix,modelMatrix); //calculando matriz intermediaria
mat4.multiply(mvpMatrix,projectionMatrix,mvMatrix); //matriz final A ORDEM IMPORTA!!!!!!!!!!!!! tem que ser essa ordem

let currentStep = 0; // Qual pontos da linha desenhar, vai de 1 em 1
let cameraX = 0.0; // quanto modificar X da camera
let cameraY = 0.0; // quanto modificar Y da camera
let controlDiff = 0; // controla o vetor do diffPoints que contem as distâncias
const totalSteps = midPoints.length / 3; // quantos steps desenharão todos pontos da linha

function animate(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // limpa a tela

    cameraX += diffPoints[controlDiff]; // isso mexe a camera em x
    cameraY += diffPoints[controlDiff+1]; // isso mexe a camera em y
    mat4.identity(viewMatrix); // zera a matriz 
    mat4.translate(viewMatrix,viewMatrix,[cameraX,cameraY,1.5]); // camera
    mat4.invert(viewMatrix,viewMatrix);
    mat4.multiply(mvMatrix,viewMatrix,modelMatrix);
    mat4.multiply(mvpMatrix,projectionMatrix,mvMatrix); // matriz final

    gl.uniformMatrix4fv(uniformLocations.matrix,false,mvpMatrix); // passa matriz
    gl.uniform1f(uniformLocations.tam,10.0); // passa o tam
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color1),gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS,0,4); // desenha os 4 pontos principais

    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(controlData),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color2),gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS,0,3); // desenha os 3 pontos de controle

    gl.uniform1f(uniformLocations.tam,1.0); // muda o tam para desenhar os pontos da linha
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(midPoints),gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS,0,currentStep);    // desenha os pontinhos da linha 

    requestAnimationFrame(animate); // importante para funcionar
    currentStep++;
    controlDiff += 2;
    }
requestAnimationFrame(animate); // chama

// Talvez fosse possivel tirar os pontos de controle e pontos principais do loop? não sei
    

