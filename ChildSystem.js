"use strict";
var vertexShaderSource = `
attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;

varying vec4 v_color;

void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;
}
`;

var fragmentShaderSource = `
precision mediump float;

varying vec4 v_color;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;

void main() {
   gl_FragColor = v_color * u_colorMult + u_colorOffset;
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

Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
  if (parentWorldMatrix) {
    multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  } else {
    copy(this.localMatrix, this.worldMatrix);
  }
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const sphereBufferInfo0 = createCubeWithVertexColorsBufferInfo(gl, 50);
  const sphereBufferInfo1 = createCubeWithVertexColorsBufferInfo(gl, 30);

  var programInfo = createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
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
      u_colorOffset: [0.6, 0.6, 0, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo0,
  };

  var child = new Node();
  child.localMatrix = translation(100, 0, 0);  
  child.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1],  
      u_colorMult:   [0.8, 0.5, 0.2, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo1,
  };


  child.setParent(Mother);

  var objects = [
    Mother,
    child,
  ];

  var objectsToDraw = [
    Mother.drawInfo,
    child.drawInfo,
  ];

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time *= 0.0005;
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
    multiply(yRotation(0.01), child.localMatrix, child.localMatrix);

    Mother.updateWorldMatrix();

    objects.forEach(function(object) {
      object.drawInfo.uniforms.u_matrix = multiply(viewProjectionMatrix, object.worldMatrix);
    });


    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        bindBuffers = true;
      }
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }
      setUniforms(programInfo, object.uniforms);
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
