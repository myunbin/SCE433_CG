/**
 * @type {WebGLRenderingContext}
 */
let gl;

const defaultStep = 100;
const aniMode = 'default';  // option: default, crank, person, hand

let shapeBufMapper = {};

let positionLocation;
let normalLocation;


/**********************************************************************************
 * Axis
 *********************************************************************************/
const xAxis = 0;
const yAxis = 1;
const zAxis = 2;

/**********************************************************************************
 * Model-View
 *********************************************************************************/
let modelViewMatrix;
let modelViewMatrixLoc;

let cameraAngleX = 0;
let cameraAngleY = 0;
let cameraDistance = 3;

let cameraPosition = vec3(0, 0, cameraDistance);
let cameraTarget = vec3(0, 0, 0);
let cameraView = subtract(cameraTarget, cameraPosition);
let cameraUp = vec3(0, 1, 0);

let moveSpeed = 0.1; // speed of camera movement
let rotateSpeed = 0.1; // speed of camera rotation

let lastMouseX;
let lastMouseY;

let color = vec4(0.0, 0.0, 0.0, 1.0);
let colorLocation;

/**********************************************************************************
 * Projection
 *********************************************************************************/
let projectionMatrix;
let projectionMatrixLoc;

let calcedMatrix;

/**********************************************************************************
 * Light
 *********************************************************************************/
let lightPosition = vec4(3.0, 3.0, 3.0, 0.0);
let lightPositionLoc;

let lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

let materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
let materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let materialShininess = 16.0;

/**********************************************************************************
 * Texture
 *********************************************************************************/
let texture;
let textureLoc;
let useTexLoc;

let cylinderTexBuffer;
let sphereTexBuffer;
let texCoordLocation;

var frameCnt = 0;

function isPowerOf2(value) {
  return (value & (value - 1) === 0);
}

window.onload = () => {
  const cylinderV = cylinder(0.1, 0.5, 100);
  const sphereV = sphere(0, 0, 0, aniMode === 'hand' ? 0.1 : 0.15, aniMode === 'crank' ? 10 : defaultStep);
  const tetrahedronV = tetrahedron(0.2);
  const cubeV = cube(0.1);
  const shapeMapper = { cylinderV, sphereV, tetrahedronV, cubeV };
  let canvas = document.getElementById('gl-canvas');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert('WebGL isn\'t available'); }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1., 1., 1.0, 1.0);

  let program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.programObject = program;

  gl.useProgram(program);

  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([255, 255, 255, 255]); // opaque blue

  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = img;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const num = 2; // every coordinate composed of 2 values
  const type = gl.FLOAT; // the data in the buffer is 32-bit float
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set to the next
  const offset = 0; // how many bytes inside the buffer to start from

  texCoordLocation = gl.getAttribLocation(program, 'aTexCoord');
  gl.vertexAttribPointer(
    texCoordLocation,
    num,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(texCoordLocation);

  textureLoc = gl.getUniformLocation(program, 'uTexture');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLoc, 0);

  useTexLoc = gl.getUniformLocation(program, 'uUseTexture');
  gl.uniform1f(useTexLoc, 0);

  const shapeLst = [
    'cube',
    'sphere',
    'tetrahedron',
    'cylinder',
  ];
  shapeLst.forEach((shape) => {
    shapeBufMapper[shape] = {};
    shapeBufMapper[shape].triangles = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufMapper[shape].triangles);
    gl.bufferData(gl.ARRAY_BUFFER, shapeMapper[`${shape}V`].triangles, gl.STATIC_DRAW);
    
    shapeBufMapper[shape].normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufMapper[shape].normals);
    gl.bufferData(gl.ARRAY_BUFFER, shapeMapper[`${shape}V`].normals, gl.STATIC_DRAW);
    
    shapeBufMapper[shape].texture = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufMapper[shape].texture);
    gl.bufferData(gl.ARRAY_BUFFER, shapeMapper[`${shape}V`].texCoords, gl.STATIC_DRAW);

    shapeBufMapper[shape].length = shapeMapper[`${shape}V`].triangles.length / 3;
  });

  positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);
  
  normalLocation = gl.getAttribLocation(program, 'aNormal');
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLocation);
  
  modelViewMatrix = mat4();
  modelViewMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
  updateModelView();
  
  const fieldOfView = 60;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  
  projectionMatrix = perspective(fieldOfView, aspect, zNear, zFar);
  projectionMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  
  let ambientProduct = mult(lightAmbient, materialAmbient);
  let diffuseProduct = mult(lightDiffuse, materialDiffuse);
  let specularProduct = mult(lightSpecular, materialSpecular);
  
  lightPositionLoc = gl.getUniformLocation(program, 'lightPosition');
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  colorLocation = gl.getUniformLocation(program, 'aColor');
  gl.uniform4fv(colorLocation, flatten(color));
  
  gl.uniform4fv(gl.getUniformLocation(program, 'ambientProduct'), flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, 'diffuseProduct'), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, 'specularProduct'), flatten(specularProduct));

  gl.uniform1f(gl.getUniformLocation(program, 'shininess'), materialShininess);

  calcedMatrix = transpose(projectionMatrix).flat();
  mulMatrix(calcedMatrix, transpose(modelViewMatrix).flat());

  render();
};

let mov_matrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

var trState = [0, 0, 0];
var rotSpd = [0, 0, 0];
var rotState = [0, 0, 0];
var scState = [1, 1, 1];

var renderObj = renderObjMapper[aniMode] ?? { data: renderDefault, renderBefore: () => {} };

function renderObject(locMmatrix, obj, node, trMatrixOrigin, dt) {
  const matOri = [...trMatrixOrigin];

  node.rotateSpd.forEach((spd, i) => node.rotate[i] = (node.rotate[i] + spd * dt) % (2 * Math.PI));
  node.rotateNodeSpd.forEach((spd, i) => node.rotateNode[i] = (node.rotateNode[i] + spd * dt) % (2 * Math.PI));

  translate(matOri, ...node.translate);

  if (!node.isRoot) {
    gl.uniform1f(useTexLoc, aniMode === 'crank');
    const matEdge = [...matOri];
    rotateZ(matEdge, -Math.PI / 2);
    const vec = node.translate.map(i => -i);

    let vec1 = [vec[0], vec[1]];
    const vec1Size = Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1]);
    if (vec1Size != 0) {
      vec1 = vec1.map(i => i / vec1Size);
      const angle1 = Math.acos(vec1[0]);
      rotateZ(matEdge, vec1[1] > 0 ? angle1 : -angle1);
    }
    
    let vec2 = [Math.sqrt(vec[0] ** 2 + vec[1] ** 2), vec[2]];
    const vec2Size = Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
    if (vec2Size != 0) {
      vec2 = vec2.map(i => i / vec2Size);
      const angle2 = Math.acos(vec2[0]);
      rotateX(matEdge, vec2[1] > 0 ? angle2 : -angle2);
    }

    const vecSize = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
    scale(matEdge, 1, vecSize, 1);
    translate(matEdge, 0, 0.5, 0);

    gl.uniform4fv(colorLocation, new Float32Array([1.0, 1.0, 1.0, 1]));
    gl.uniformMatrix4fv(locMmatrix, false, matEdge);


    const { triangles, normals, length, texture } = shapeBufMapper['cylinder'];

    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texture);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangles);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normals);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, length);
  }
  
  scale(matOri, ...node.scale);
  rotateX(matOri, node.rotate[0]);
  rotateY(matOri, node.rotate[1]);
  rotateZ(matOri, node.rotate[2]);

  const matNodeRotate = [...matOri];
  rotateX(matNodeRotate, node.rotateNode[0]);
  rotateY(matNodeRotate, node.rotateNode[1]);
  rotateZ(matNodeRotate, node.rotateNode[2]);

  const mat = [...calcedMatrix];
  mulMatrix(mat, matNodeRotate);
  const oriX = mat[12];
  const oriY = mat[13];
  const divV = mat[15];
  const cordX = (1 + oriX / divV) * (gl.canvas.clientWidth / 2);
  const cordY = (1 - oriY / divV) * (gl.canvas.clientHeight / 2);
  node.calcedCoord = [cordX, cordY];

  gl.uniform1f(useTexLoc, 0);
  gl.uniform4fv(colorLocation, flatten(vec4(...node.color)));
  gl.uniformMatrix4fv(locMmatrix, false, matNodeRotate);

  const { triangles, normals, length, texture } = shapeBufMapper[node.shape];
  gl.enableVertexAttribArray(texCoordLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texture);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangles);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normals);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, length);

  for (let i = 0; i < node.children.length; i++) {
    const cnode = obj[node.children[i]];
    renderObject(locMmatrix, obj, cnode, matOri, dt);
  }
}

let lastRenderTime = null;

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);

  let locMmatrix = gl.getUniformLocation(gl.programObject, 'Mmatrix');
  idMatrix(mov_matrix);
  let dt = lastRenderTime ? (Date.now() - lastRenderTime) / 1000 : 0;

  for (let i = 0; i < 3; i++) {
    let nv = rotState[i] + rotSpd[i] * dt;
    let axis = [0, 0, 0];
    axis[i] = 1;
    if (nv > Math.PI * 2) {
      nv -= Math.PI * 2;
    }
    rotState[i] = nv;
    if (window.cusEvt && rotSpd[i] !== 0) {
      window.cusEvt('rot', { rotType: i, value: rotState[i] });
    }
    rotateArbAxis(mov_matrix, rotState[i], axis);
  }

  scale(mov_matrix, ...scState);
  translate(mov_matrix, ...trState);

  const { data, renderBefore } = renderObj;
  renderBefore(data, dt);
  renderObject(locMmatrix, data, data.root, mov_matrix, dt);

  lastRenderTime = Date.now();
  renderDone();

  frameCnt++;

  requestAnimationFrame(render);
}

setInterval(() => {
  document.getElementById('fps').textContent = frameCnt.toString();
  frameCnt = 0;
}, 1000);


function updateModelView() {
  modelViewMatrix = lookAt(cameraPosition, add(cameraPosition, cameraView), cameraUp);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}
