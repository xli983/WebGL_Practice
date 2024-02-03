// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system.html


"use strict";

var vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_color;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;

out vec4 outColor;

void main() {
   outColor = v_color * u_colorMult + u_colorOffset;
}
`;

var Node = function() {
  this.children = [];
  this.localMatrix = identity();
  this.worldMatrix = identity();
};

Node.prototype.setParent = function(parent) {
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(matrix) {
  if (matrix) {
    multiply(matrix, this.localMatrix, this.worldMatrix);
  } else {
    copy(this.localMatrix, this.worldMatrix);
  }
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};
function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program)); 
  gl.deleteProgram(program);
  return undefined;
}


function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }


  var sphereBufferInfo0 = createCubeWithVertexColorsBufferInfo(gl, 50);
  var sphereBufferInfo1 = createCubeWithVertexColorsBufferInfo(gl, 30);

  // setup GLSL program
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  var program = createProgram(gl, vertexShader, fragmentShader);
  var programInfo = createProgramInfo(gl, program);

  var sphereVAO0 = createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo0);
  var sphereVAO1 = createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo1);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  var objectsToDraw = [];
  var objects = [];

  // Let's make all the nodes
  var Mother = new Node();
  Mother.localMatrix = translation(0, 0, 0);  
  Mother.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], 
      u_colorMult:   [0.4, 0.4, 0, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo0,
    vertexArray: sphereVAO0,
  };

  var childNode = new Node();
  childNode.localMatrix = translation(100, 0, 0);  
  childNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1], 
      u_colorMult:   [0.8, 0.5, 0.2, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo1,
    vertexArray: sphereVAO1,
  };


  childNode.setParent(Mother);

  var objects = [
    Mother,
    childNode,
  ];

  var objectsToDraw = [
    Mother.drawInfo,
    childNode.drawInfo,
  ];

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;

    resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        perspective(fieldOfViewRadians, aspect, 1, 2000);

    var cameraPosition = [-200, -200, 0];
    var target = [0, 0, 0];
    var up = [0, 0, 1];
    var cameraMatrix = lookAt(cameraPosition, target, up);

    var viewMatrix = inverse(cameraMatrix);

    var viewProjectionMatrix = multiply(projectionMatrix, viewMatrix);

    multiply(yRotation(0.01), Mother.localMatrix  , Mother.localMatrix);
    multiply(yRotation(0.01), childNode.localMatrix, childNode.localMatrix);

    Mother.updateWorldMatrix();

    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = multiply(viewProjectionMatrix, object.worldMatrix);
    });


    drawObjectList(gl, objectsToDraw);

    requestAnimationFrame(drawScene);
  }
}

main();