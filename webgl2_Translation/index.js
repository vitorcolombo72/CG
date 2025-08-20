"use strict";

var vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_translation;

void main() {
  vec2 position = a_position + u_translation;
  vec2 zeroToOne = position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}
`;

const figures = [
  {
    draw: setGeometryF,
    translation: [0, 0],
    color: [1, 0, 0, 1],
    vertexCount: 18,
  },
  {
    draw: setGeometryTriangle,
    translation: [200, 100],
    color: [0, 1, 0, 1],
    vertexCount: 3,
  },
  {
    draw: (gl) => setGeometryRectangle(gl, 80, 60),
    translation: [300, 200],
    color: [0, 0, 1, 1],
    vertexCount: 6,
  },
];

function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) return;

  var program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var translationLocation = gl.getUniformLocation(program, "u_translation");

  var positionBuffer = gl.createBuffer();
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

  // NÃO configuramos vertexAttribPointer aqui ainda — faremos isso em drawScene após bufferData.

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    for (const figure of figures) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      figure.draw(gl); // atualiza buffer


      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.uniform4fv(colorLocation, figure.color);
      gl.uniform2fv(translationLocation, figure.translation);
      gl.drawArrays(gl.TRIANGLES, 0, figure.vertexCount);
    }
  }
  for (let i = 0; i < figures.length; i++) {
  webglLessonsUI.setupSlider(`#x${i}`, {
    slide: updateTranslation(figures[i].translation, 0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider(`#y${i}`, {
    slide: updateTranslation(figures[i].translation, 1),
    max: gl.canvas.height,
  });
}
  /*webglLessonsUI.setupSlider("#x1", {
    slide: updateTranslation(figures[0].translation, 0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y1", {
    slide: updateTranslation(figures[0].translation, 1),
    max: gl.canvas.height,
  });
  webglLessonsUI.setupSlider("#x2", {
    slide: updateTranslation(figures[1].translation, 0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y2", {
    slide: updateTranslation(figures[1].translation, 1),
    max: gl.canvas.height,
  });
    */
  function updateTranslation(translationArray, index) {
    return function (event, ui) {
      translationArray[index] = ui.value;
      drawScene();
    };
  }

  drawScene();
}

function setGeometryF(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0, 30, 0, 0, 150,
      0, 150, 30, 0, 30, 150,
      30, 0, 100, 0, 30, 30,
      30, 30, 100, 0, 100, 30,
      30, 60, 67, 60, 30, 90,
      30, 90, 67, 60, 67, 90
    ]),
    gl.STATIC_DRAW
  );
}

function setGeometryTriangle(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 100, 0, 50, 100]),
    gl.STATIC_DRAW
  );
}

function setGeometryRectangle(gl, width = 100, height = 100) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0,
      width, 0,
      0, height,
      0, height,
      width, 0,
      width, height,
    ]),
    gl.STATIC_DRAW
  );
}

main();
