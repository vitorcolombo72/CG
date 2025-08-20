/*
utils.js contains helper functions for creating:shaders,programs, sphere code and others
shaders.js contains shaders for drawing the orbits
shaderSun.js and shaderAsteroid.js are self explanatory
*/ 
import { vertexShaderSource, fragmentShaderSource, fragmentShaderSourceGradient } from "./shaders.js";
import { vertexShaderSourceSun, fragmentShaderSourceSun } from "./shaderSun.js";
import { vertexShaderSourceAsteroid, fragmentShaderSourceAsteroid } from "./shaderAsteroid.js";
import * as utils from "./utils.js";

async function main() {
  var slider = document.getElementById("myRange"); // slider for speed control
  let timeoutExec = 0; // when speed is < 1 use timeoutExec for slowing the movements
  let debounceTimer = null; // timeout for slider selection -> Fast selections could cause problems with the orbits

  slider.oninput = function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      let sliderInt = parseInt(this.value, 10);
      if (sliderInt >= 1) {
        speed = sliderInt;
        timeoutExec = 0;
      } else {
        speed = 1;
        timeoutExec = Math.abs(sliderInt * 10);
      }
    }, 50); 
  };
  const canvas = document.querySelector("canvas"); // getCanvas
  // Set canvas size to match its on-screen size
  const dpr = window.devicePixelRatio || 1; 
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.focus();
  const gl = canvas.getContext("webgl2"); //webgl2 context
  //throw error if webgl2 not found
  if (!gl) {
    throw new Error("ERRO!");
  }
  //contains data for all planets and other asteroids
  const arquivos = [
    "mercury.txt",
    "venus.txt",
    "earth.txt",
    "mars.txt",
    "jupiter.txt",
    "saturn.txt",
    "uranus.txt",
    "neptune.txt",
    "voyager1.txt",
    "halley.txt",
    "ulysses.txt",
    "hyakutake.txt",
  ];
  /*
    finalValues contains data for drawing all orbits of all planets and asteroids, its an array of arrays structured as:
    finalValues[0] -> mercury -> [x0,y0,z0,x1,y1,z1] and so on
    diffValues contains data for translating all planets and asteroids, its an array of arrays structured as:
    diffValues[0] -> mercury ->[x1-x0,y1-y0,z1-z0,x2-x1,y2-y1,z2-z1] and so on
    check utils.js -> readPlanet() for detailed functioning
  */
  const finalValues = []; 
  const diffValues = []; 
  for (const nomeArquivo of arquivos) { // get data for all objects from files
    const valores = await utils.readPlanet(nomeArquivo);
    finalValues.push(valores.finalValues);
    diffValues.push(valores.diffValues);
  }
  const daysValues = await utils.readData("earth.txt"); // get data to display current date
  const displaydata = document.getElementById("displaydata"); // element for displaying current date

  // setting sun texture
  const noiseTexture = gl.createTexture();
  const image = new Image();
  image.src = "perlin11.png"; // different types of noises can substantially change the final result
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  //setting hyakutake texture
  const cometTexture = gl.createTexture();
  const cometImage = new Image();
  cometImage.src = 'blue.jpg'; // got this texture from Freepik
  cometImage.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, cometTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cometImage);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  /*
    The way all elements move in this code is:
    diffValues contains offsets vectors for each planet and asteroid
    to move them, we increment the offsets step by step using xx, yy, and zz arrays (see below).
    Index[0] is mercury Index[1] is venus and so on
    lastStep is used when speed > 1, to track skipped steps; if we miss any step, the planets may drift off their paths
  */
  let lastStep = [];
  let xx = []; 
  let yy = []; 
  let zz = []; 
  function createPlanet(index, color, scale, initialPos) {
    //set all values to 0 at first
    xx[index] = 0;
    yy[index] = 0;
    zz[index] = 0;
    lastStep[index] = 0;
    // creates the sphereObject for all elements except the moon and the sun
    // this syntax is used for implementing transformFunc() which translates the solar bodies
    return utils.createSphereObject(gl, color, (matrix, currentStep) => {
      if(index !=11){ // apply single color shader for drawing all elements
        gl.useProgram(program);
      }
      else{ // apply different shader to hyakutake
        gl.useProgram(programAsteroid);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.uniform1f(asteroidUniformLocations.uTime,performance.now() * 0.0002);
        gl.uniform2f(asteroidUniformLocations.uResolution,1.0,1.0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cometTexture);
        gl.uniform1i(asteroidUniformLocations.uTexture,0);
        
      }
      // loop controling all movements
      for(let step = lastStep[index] ; step < speed + currentStep;step++){
      let idx = step * 3;
      xx[index] += diffValues[index][idx];
      yy[index] += diffValues[index][idx + 1];
      zz[index] += diffValues[index][idx + 2];
      }
      lastStep[index] = currentStep + speed ; // saves the lastStep performed
      mat4.identity(matrix); // reset matrix
      // perform translation
      mat4.translate(matrix, matrix, [
        initialPos[0] + xx[index],
        initialPos[1] + yy[index],
        initialPos[2] + zz[index],
      ]);
      // perform scale
      mat4.scale(matrix, matrix, scale);
    });
  }
  /*
    Each object except for the sun and the moon are created with the createPlanet() above
    parameters for each of these objects are: index, color, scale and initialPos
    for the sun use utils.createSphereObject directly and set its specific shader and uniforms
    for the moon use utils.createSphereObject directly, note that the movement is not based on data from files
  */
  const sun = utils.createSphereObject(gl, [1, 1, 0], (matrix, currentStep) => {
    gl.useProgram(programSun);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    mat4.identity(matrix);
    mat4.scale(matrix, matrix, [180, 180, 180]); // Biggest object in the solar system
    gl.uniform1f(sunUniformLocations.time, performance.now() * 0.0002);
    gl.uniform2f(sunUniformLocations.resolution, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.uniform1i(sunUniformLocations.noiseLocation, 0);
  });
  const moon = utils.createSphereObject(gl, [1, 1, 1], (matrix, currentStep) => {
      // starting positions
      const baseX = 0.8904 * 1000;
      const baseY = 0.4138 * 1000;
      const baseZ = -0.0526 * 1000;
    
      const moonRadius = 150;
      const moonSpeed = 0.15;
      const angle = currentStep * moonSpeed;
      const orbitInclination = 0; 

      const earthX = baseX + xx[2];
      const earthY = baseY + yy[2];
      const earthZ = baseZ + zz[2];

      const moonX = earthX + moonRadius * Math.cos(angle);
      const moonY = earthY + moonRadius * Math.sin(angle) * Math.cos(orbitInclination);
      const moonZ = earthZ + moonRadius * Math.sin(angle) * Math.sin(orbitInclination);

      mat4.identity(matrix);
      mat4.translate(matrix, matrix, [moonX, moonY, moonZ]);
      mat4.scale(matrix, matrix, [20, 20, 20]);
    }
  );
  const mercury = createPlanet(
    0,
    [1, 0, 0],
    [50, 50, 50],
    [0.031 * 1000, 0.3606 * 1000, -0.0046 * 1000]
  );
  const venus = createPlanet(
    1,
    [1, 0.65, 0],
    [95, 95, 95],
    [-0.6007 * 1000, 0.402 * 1000, -0.0263 * 1000]
  );
  const earth = createPlanet(
    2,
    [0, 0, 1],
    [100, 100, 100],
    [0.8904 * 1000, 0.4138 * 1000, -0.0526 * 1000]
  );
  const mars = createPlanet(
    3,
    [1, 0, 0],
    [75, 75, 75],
    [0.7293 * 1000, 1.4841 * 1000, -0.1345 * 1000]
  );
  const jupiter = createPlanet(
    4,
    [0.8, 0.6, 0],
    [150, 150, 150],
    [4.7117 * 1000, -1.6989 * 1000, 0.1347 * 1000]
  );
  const saturn = createPlanet(
    5,
    [0.9, 0.5, 0.1],
    [130, 130, 130],
    [-1.6055 * 1000, -9.5698 * 1000, 0.9278 * 1000]
  );
  const uranus = createPlanet(
    6,
    [0, 1, 1],
    [110, 110, 110],
    [1.0429 * 1000, 18.1433 * 1000, -2.0562 * 1000]
  );
  const neptune = createPlanet(
    7,
    [0, 0.2, 1],
    [110, 110, 110],
    [-26.9092 * 1000, 13.9511 * 1000, -0.8315 * 1000]
  );
  const voyager1 = createPlanet(
    8,
    [0.9, 0, 0],
    [50, 50, 50],
    [-0.0354 * 1000, -0.9995 * 1000, 0.1271 * 1000]
  );
  const ulysses = createPlanet(
    10,
    [0.40, 0.40, 0.40],
    [30, 30, 30],
    [0.4678 * 1000, -0.8760 * 1000, 0.1114 * 1000]
  );
  const hyakutake = createPlanet(
    11,
    [0.6, 0.6, 0.6],
    [40, 40, 40],
    [-1.2413 * 1000, 2.0142 * 1000, -0.7674 * 1000]
  );
  let planets = []; // array containing all solar bodies that move
  planets.push( // push all elements that are added at the start of the execution, later add voyager1,halley,ulysses,hyakutake
    mercury,
    venus,
    earth,
    mars,
    jupiter,
    saturn,
    uranus,
    neptune,
    moon,
  );
  //create, link and compile shaders used to draw orbits and spheres, except for sun and hyakutake 
  const vertexShader = utils.createShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
  const fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = utils.createProgram(gl, vertexShader, fragmentShader);
  //create, link and compile shaders for the sun 
  const vertexShaderSun = utils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSourceSun);
  const fragmentShaderSun = utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceSun);
  const programSun = utils.createProgram(gl, vertexShaderSun, fragmentShaderSun);
  //create, link and compile shaders for hyakutake's tail note we use vertexShader previously compiled
  const fragmentShaderGradient = utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceGradient);
  const programCometOrbit = utils.createProgram(gl, vertexShader, fragmentShaderGradient);
  //create, link and compile shaders for hyakutake
  const vertexShaderAsteroid = utils.createShader(gl,gl.VERTEX_SHADER,vertexShaderSourceAsteroid);
  const fragmentShaderAsteroid = utils.createShader(gl,gl.FRAGMENT_SHADER,fragmentShaderSourceAsteroid);
  const programAsteroid = utils.createProgram(gl,vertexShaderAsteroid,fragmentShaderAsteroid);


  //uniform locations for orbits and spheres except for the sun and hyakutake
  const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
    tam: gl.getUniformLocation(program, `tam`),
    color: gl.getUniformLocation(program, `color`),
  };
  //uniform locations for the sun
  const sunUniformLocations = {
    time: gl.getUniformLocation(programSun, "time"),
    resolution: gl.getUniformLocation(programSun, "resolution"),
    mouse: gl.getUniformLocation(programSun, "mouse"),
    noiseLocation: gl.getUniformLocation(programSun, "noiseTexture"),
    matrix: gl.getUniformLocation(programSun, "matrix"),
  };
  // uniform locations for hyakutake's tail
  const cometUniformLocations = {
    matrix: gl.getUniformLocation(programCometOrbit, `matrix`),
    tam: gl.getUniformLocation(programCometOrbit, `tam`),
    color: gl.getUniformLocation(programCometOrbit, `color`),
  };
  // uniform locations for hyakutake's sphere
  const asteroidUniformLocations = {
    matrix: gl.getUniformLocation(programAsteroid, `matrix`),
    uTime: gl.getUniformLocation(programAsteroid, `uTime`),
    uTexture: gl.getUniformLocation(programAsteroid,`uTexture`),
    uResolution: gl.getUniformLocation(programAsteroid,`uResolution`)
  };

  const viewMatrix = mat4.create(); // matrix for the camera

  const projectionMatrix = mat4.create(); // matrix for perspective
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180,
    canvas.width / canvas.height,
    0.001,
    1e9
  );
  // called at animate(), responsible for drawing all objects
  function drawSphere(sphere, viewMatrix, projectionMatrix, currentStep) {
    sphere.updateMatrix(sphere.matrix, currentStep); // updates matrix each currentStep
    const mvMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    mat4.multiply(mvMatrix, viewMatrix, sphere.matrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix); // calculate mvpMatrix
    // send mvpMatrix to shaders
    if(sphere == hyakutake ){
      gl.uniformMatrix4fv(asteroidUniformLocations.matrix,false,mvpMatrix);
    }
    else if(sphere == sun){
      gl.uniformMatrix4fv(sunUniformLocations.matrix, false, mvpMatrix);
    }else{
      gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
      gl.uniform3f(uniformLocations.color, sphere.color[0], sphere.color[1], sphere.color[2]);
    }
    //for spheres, use element_array_buffer and array_buffer
    utils.setAttribute(gl, program, "position", gl.ARRAY_BUFFER, sphere.positionBuffer, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indexBuffer);
     // draw the sphere using element array buffer (indexed drawing)
    gl.drawElements(gl.TRIANGLES, sphere.triangles.flat().length, gl.UNSIGNED_SHORT, 0); // draw
  }

  const orbitBuffers = []; // array of buffers containing data to draw orbits
  // fill orbitBuffers with data from finalValues 
  for (let i = 0; i < finalValues.length; i++) {
    const buffer = utils.createBuffer(gl, gl.ARRAY_BUFFER, finalValues[i], gl.STATIC_DRAW);
    orbitBuffers.push(buffer);
  }

  let cameraTheta = 0; // horizontal
  let cameraPhi = 0; // vertical
  let cameraRadius = 1000; // distance camera to center
  // Mouse-based camera control: rotate with drag, zoom with scroll
  let isDragging = false;
  let lastMouseX, lastMouseY;

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    cameraTheta -= dx * 0.005;
    cameraPhi -= dy * 0.005;
    cameraPhi = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, cameraPhi)
    );
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault(); 
    const zoomSpeed = 100;
    cameraRadius += e.deltaY * 0.01 * zoomSpeed;
    cameraRadius = Math.max(300, Math.min(10000, cameraRadius));
  });
  //called at animate() responsible for drawing all orbits
  function drawOrbits(i, currentStep) {
    utils.setAttribute(gl, program, "position", gl.ARRAY_BUFFER, orbitBuffers[i], 3);
    const modelMatrix = mat4.create();
    const mvMatrix = mat4.create();
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.useProgram(program);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
    if (i < 8) { // mercury to neptune
      gl.uniform3f(uniformLocations.color, 1, 1, 0);
    } else if (i == 8) { //voyager
      gl.uniform3f(uniformLocations.color, 1, 0, 0); // voyager -> red
    } else if (i == 9) { //halley
      gl.uniform3f(uniformLocations.color, 0, 1, 1); // halley -> cyan
    } else if (i == 10) { //ulysses
      gl.uniform3f(uniformLocations.color, 0.75, 0.75, 0.75); // ulysses -> gray
    } else if (i == 11) { //hyakutake
      gl.useProgram(programCometOrbit);
      gl.uniform3f(cometUniformLocations.color, 1, 0, 0);
      gl.uniformMatrix4fv(cometUniformLocations.matrix, false, mvpMatrix);

      const tailLength = 100; 
      const startIdx = Math.max(0, currentStep - tailLength);
      gl.drawArrays(gl.LINE_STRIP, startIdx, currentStep - startIdx); // draw hyakutake tail
      return; 
    } else if (i == 12) { //moon 
      gl.uniform3f(uniformLocations.color, 1, 0, 0);
    }
    gl.drawArrays(gl.LINE_STRIP, 0, currentStep); // draw line using LINE_STRIP
  }
  var currentStep = 0; // each step equals one day
  let cameraFocus = createCameraFocus(planets);
  let from = [];
  let speed = 1;
  let activateVoyager = false,activateHyakutake = false,activateUlysses = false;

  async function animate() {
    currentStep+= speed;
    cameraFocus = calculateCameraFocus(cameraFocus, currentStep, diffValues,speed);
    await new Promise((r) => setTimeout(r, timeoutExec )); // timeout de exec
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!followingPlanet) { // free play
      let from = calculateCamera(cameraRadius, cameraPhi, cameraTheta);
      mat4.lookAt(viewMatrix, [from[0], from[1], from[2]],[0, 0, 0], [0, 1, 0]);
    } else { // lock camera on planet
      let pppp = calculateCamera(cameraRadius, cameraPhi, cameraTheta);
      from = [
        cameraFocus.CamX[camTarget] + finalValues[camTarget][0] + 100,
        cameraFocus.CamY[camTarget] + finalValues[camTarget][1] + 200,
        cameraFocus.CamZ[camTarget] + finalValues[camTarget][2] + 50,
      ];
      mat4.lookAt(
        viewMatrix,
        [from[0] + pppp[0], from[1] + pppp[1], from[2] + pppp[2]],
        [
          cameraFocus.CamX[camTarget] + finalValues[camTarget][0],
          cameraFocus.CamY[camTarget] + finalValues[camTarget][1],
          cameraFocus.CamZ[camTarget] + finalValues[camTarget][2],
        ],
        [0, 1, 0]
      );
    }

    for (let i = 0; i < finalValues.length; i++) {
      drawOrbits(i, Math.floor(currentStep));
    }
    drawSphere(sun, viewMatrix, projectionMatrix, currentStep);
    planets.forEach((planet) => {
      drawSphere(planet, viewMatrix, projectionMatrix, currentStep);
    });
    if (currentStep >= 12 * 365 + 249 && !activateVoyager) {
      planets.push(voyager1);
      activateVoyager = true;
    }
    if (currentStep >= 25 * 365 + 280 && !activateUlysses) {
      planets.push(ulysses);
      activateUlysses = true;
    }
    if (currentStep >= 32 * 365 && !activateHyakutake) {
      planets.push(hyakutake);
      activateHyakutake = true;
    }
    displaydata.innerText = daysValues[currentStep];
    if(currentStep >= 55 * 365)
    {
      location.href = location.origin + location.pathname;
      throw new Error("Fim!");
    }
    requestAnimationFrame(animate);
  }
  let camTarget = -1;
  let followingPlanet = false;
  const planetIndex = {
    mercury: 0,
    venus: 1,
    earth: 2,
    mars: 3,
    jupiter: 4,
    saturn: 5,
    uranus: 6,
    neptune: 7,
    voyager1: 8,
    ulysses: 10,
    hyakutake: 11,
  };

  const checkboxes = document.querySelectorAll(".planet-checkbox");
  checkboxes.forEach((box) => {
    box.addEventListener("click", () => {
      checkboxes.forEach((b) => {
        if (b !== box) b.checked = false;
      });
      if (box.checked) {
        const planetName = box.id;
        camTarget = planetIndex[planetName];
        followingPlanet = true;
      } else {
        followingPlanet = false;
      }
    });
  });

  requestAnimationFrame(animate); // call animate
}

main();

function calculateCamera(cameraRadius, cameraPhi, cameraTheta) {
  const x = cameraRadius * Math.cos(cameraPhi) * Math.sin(cameraTheta);
  const y = cameraRadius * Math.sin(cameraPhi);
  const z = cameraRadius * Math.cos(cameraPhi) * Math.cos(cameraTheta);
  return [x, y, z];
}
function createCameraFocus(planets) {
  let CamX = [], CamY = [], CamZ = [];
  for (let i = 0; i < planets.length + 3; i++) {
    CamX.push(0);
    CamY.push(0);
    CamZ.push(0);
  }
  return { CamX, CamY, CamZ };
}
function calculateCameraFocus(cameraFocus, currentStep, diffValues) {
  for (let i = 0; i < cameraFocus.CamX.length; i++) {
    let x = 0, y = 0, z = 0;
    for (let step = 0; step < currentStep; step++) {
      let idx = step * 3;
      x += diffValues[i][idx];
      y += diffValues[i][idx + 1];
      z += diffValues[i][idx + 2];
    }
    cameraFocus.CamX[i] = x;
    cameraFocus.CamY[i] = y;
    cameraFocus.CamZ[i] = z;
  }
  return cameraFocus;
}