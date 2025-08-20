export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  console.log(gl.getShaderInfoLog(shader));
  return shader;
}
export function createBuffer(gl, type, data, mode) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, data, mode);
  return buffer;
}

export function createProgram(gl, shader1, shader2) {
  const program = gl.createProgram();
  gl.attachShader(program, shader1);
  gl.attachShader(program, shader2);
  gl.linkProgram(program);
  return program;
}

export function setAttribute(gl, program, name, type, buffer, size) {
  const location = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(location);
  gl.bindBuffer(type, buffer);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  return location;
}

export function sphere(density) {
  const radsPerUnit = Math.PI / density;
  const sliceVertCount = density * 2;

  var positions = [];
  let latitude = -Math.PI / 2;
  //latitude
  for (let i = 0; i <= density; i++) {
    if (i === 0 || i === density) {
      //polar caps
      positions.push(latLngToCartesian([1, latitude, 0]));
    } else {
      let longitude = 0;
      for (let j = 0; j < sliceVertCount; j++) {
        positions.push(latLngToCartesian([1, latitude, longitude]));
        longitude += radsPerUnit;
      }
    }
    latitude += radsPerUnit;
  }
  var triangles = [];
  for (let ring = 0; ring < density - 1; ring++) {
    // start at first ring
    const initialP = ring * sliceVertCount + 1;
    for (let sliceVert = 0; sliceVert < sliceVertCount; sliceVert++) {
      const thisP = initialP + sliceVert;
      const nextP = initialP + ((sliceVert + 1) % sliceVertCount);
      if (ring === 0) {
        triangles.push([0, nextP, thisP]);
      }
      if (ring === density - 2) {
        triangles.push([thisP, nextP, positions.length - 1]);
      }
      if (ring < density - 2 && density > 2) {
        triangles.push([thisP, nextP + sliceVertCount, thisP + sliceVertCount]);
        triangles.push([thisP, nextP, nextP + sliceVertCount]);
      }
    }
  }
  positions = positions.flat();
  triangles = triangles.flat();
  return { positions, triangles };
}

function latLngToCartesian([r, lat, lng]) {
  return [
    r * Math.cos(lat) * Math.cos(lng),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.sin(lng),
  ];
}

export function createSphereObject(gl, color, transformFunc) {

let positions, triangles;

// high resolution
({ positions, triangles } = sphere(80));

// for voyager and ulysses -> low resolution
if ((color[0] === 0.9 && color[1] === 0 && color[2] === 0)
  || (color[0] == 0.40 && color[1] == 0.40 && color[2] == 0.40)
) {
  ({ positions, triangles } = sphere(3));
}

  const positionBuffer = createBuffer(
    gl,
    gl.ARRAY_BUFFER,
    new Float32Array(positions),
    gl.STATIC_DRAW
  );
  const indexBuffer = createBuffer(
    gl,
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(triangles.flat()),
    gl.STATIC_DRAW
  );

  return {
    positions,
    triangles,
    positionBuffer,
    indexBuffer,
    color,
    matrix: mat4.create(),
    updateMatrix: transformFunc, 
  };
}
export function createInfoOrbit(gl, color) {}

export function createOrbitObject(gl, color, transformFunc) {}

export async function readPlanet(archive) {
  try {
    var tes = 0;
    var xValues = [];
    var yValues = [];
    var zValues = [];
    const response = await fetch(archive);
    const text = await response.text();
    const lines = text.split("\n");
    const data = lines.map((line) => line.trim().split(/\s+/));
    if(archive == "halley.txt"){
      tes = 365*4;
    }
    if(archive == "hyakutake.txt"){
      tes = 365 * 14;
    }
    if (data.length < 25932 ) {
      var missing = 25932 - data.length - tes;
      while (missing > 0) {
        xValues.push(Number(data[0][3]));
        yValues.push(Number(data[0][4]));
        zValues.push(Number(data[0][5]));
        missing--;
      }
    }
    for (let i = 0; i < data.length; i++) {
      xValues.push(Number(data[i][3]));
      yValues.push(Number(data[i][4]));
      zValues.push(Number(data[i][5]));
    }
    const diffValues = [];
    for (let i = 0; i < xValues.length - 1; i++) {
      let x = (xValues[i + 1] - xValues[i]) * 1000;
      let y = (yValues[i + 1] - yValues[i]) * 1000;
      let z = (zValues[i + 1] - zValues[i]) * 1000;
      diffValues.push(x,y,z);
    }
    //console.log(diffValues);
    const finalValues = new Float32Array(xValues.length * 3);
    for (let i = 0; i < xValues.length; i++) {
      finalValues[i * 3] = xValues[i] * 1000; 
      finalValues[i * 3 + 1] = yValues[i] * 1000;
      finalValues[i * 3 + 2] = zValues[i] * 1000;
    }    
    //console.log(finalValues);
    return {finalValues, diffValues};
  } catch (error) {
    console.error("Erro ao carregar arquivo:", error);
  }
}
export async function readData(archive){
  let daysValues = [];
  const response = await fetch(archive);
    const text = await response.text();
    const lines = text.split("\n");
    const data = lines.map((line) => line.trim().split(/\s+/));
    for(let i = 0; i < data.length;i++){
      daysValues.push(data[i][0] + " " + data[i][1]);
    }
    //console.log(daysValues);
    return daysValues;
}
