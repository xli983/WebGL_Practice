"use strict";

var vs = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

uniform mat4 u_matrix;
uniform mat4 u_world;

out vec2 v_texcoord;
out vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  v_texcoord = a_texcoord;
  v_normal = mat3(u_world) * a_normal;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec4 texColor = texture(u_texture, v_texcoord);
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_reverseLightDirection);
  outColor = texColor;
  outColor.rgb *= light;
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

  console.log(gl.getShaderInfoLog(shader));  
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


  var sphereBufferInfo0 = createCubeWithVertexColorsBufferInfo(gl, 60);
  var sphereBufferInfo1 = createCubeWithVertexColorsBufferInfo(gl, 40);
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  var program = createProgram(gl, vertexShader, fragmentShader);
  var programInfo = createProgramInfo(gl, program);

  var sphereVAO0 = createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo0);
  var sphereVAO1 = createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo1);

  const tex0 = loadTexture(gl, 'miku.png');
  const tex1 = loadTexture(gl, 'dog.png');
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  var objectsToDraw = [];
  var objects = [];

  var Mother = new Node();
  Mother.localMatrix = translation(0, 0, 0);  
  Mother.drawInfo = {
    uniforms: {
      u_texture: tex0,
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo0,
    vertexArray: sphereVAO0,
  };

  var childNode = new Node();
  childNode.localMatrix = translation(100, 0, 0);  
  childNode.drawInfo = {
    uniforms: {
      u_texture: tex1,
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

    var cameraPosition = [-200, -50, 0];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = lookAt(cameraPosition, target, up, identity());

    var viewMatrix = inverse(cameraMatrix);

    var viewProjectionMatrix = multiply(projectionMatrix, viewMatrix);

    multiply(yRotation(0.01), Mother.localMatrix  , Mother.localMatrix);
    multiply(yRotation(0.01), childNode.localMatrix, childNode.localMatrix);

    Mother.updateWorldMatrix();


    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = multiply(viewProjectionMatrix, object.worldMatrix);
        object.drawInfo.uniforms.u_world = object.worldMatrix;
        object.drawInfo.uniforms.u_reverseLightDirection = normalize([-3.0, -2.0, -3.0]);
      });
    drawObjectList(gl, objectsToDraw);

    requestAnimationFrame(drawScene);
  }
}

main();
