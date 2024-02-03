"use strict";

var vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;

void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_normal = mat3(u_world) * a_normal;
}
`;

var fs = `#version 300 es
precision highp float;
in vec3 v_normal;
uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_reverseLightDirection);
  outColor = u_color;
  outColor.rgb *= light;
}
`;

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromSources(gl, [vs, fs]);
    var positionBuffer = createPositionBuffer(gl);
    var normalBuffer = createNormalBuffer(gl);
    //var texcoordBuffer = createTexcoordBuffer(gl);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    setupAttribute(gl, program, 'a_position', positionBuffer, 3);
    setupAttribute(gl, program, 'a_normal', normalBuffer, 3);
    //setupAttribute(gl, program, 'a_texcoord', texcoordBuffer, 2);

    var worldViewProjectionLocation =gl.getUniformLocation(program, "u_worldViewProjection");
    var worldLocation = gl.getUniformLocation(program, "u_world");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");

    function degToRad(d) {
    return d * Math.PI / 180;
    }

var Motherobjects = [];
// Parent Object
Motherobjects.push({
    translation: [45, 45, 0],
    rotation: [degToRad(0), degToRad(0), degToRad(10)],
    scale: [1, 1, 1]
});

function setUpChildren(mother){
  for (var ii = 0; ii < mother.childObjectCount; ++ii) {
      //own transformation
      var childTranslation = [80, 80, 0]; 
      var childRotation = [0, 0, 0];
      var childScale = [0.5, 0.5, 0.5]; 

      mother.childObject.push({
          translation: childTranslation,
          rotation: childRotation,
          scale: childScale
      });
  }
}

function rotateVector(vec, rot) {
  var xRotMatrix = m4.xRotation(rot[0]);
  var yRotMatrix = m4.yRotation(rot[1]);
  var zRotMatrix = m4.zRotation(rot[2]);
  var combinedRotMatrix = m4.multiply(xRotMatrix, m4.multiply(yRotMatrix, zRotMatrix));
  var rotatedVec = transformPoint(combinedRotMatrix, vec);

  return rotatedVec;
}

function updateChildren(mother) {
  for (var ii = 0; ii < mother.childObjectCount; ++ii) {
      var child = mother.childObject[ii];
      var originalRelativePosition = [
          child.translation[0] - mother.translation[0],
          child.translation[1] - mother.translation[1],
          child.translation[2] - mother.translation[2]
      ];
      var rotatedRelativePosition = rotateVector(originalRelativePosition, mother.rotation);
      child.translation[0] = mother.translation[0] + rotatedRelativePosition[0];
      child.translation[1] = mother.translation[1] + rotatedRelativePosition[1];
      child.translation[2] = mother.translation[2] + rotatedRelativePosition[2];
  }
}


Motherobjects[0].childObject =[];
Motherobjects[0].childObjectCount = 1;
setUpChildren(Motherobjects[0]);
requestAnimationFrame(drawScene);
    // Draw the scene.
    function drawScene(time) {
        time = 5 + time * 0.0001;

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(program);
        gl.bindVertexArray(vao);


        // Draw objects
        Motherobjects.forEach(function(Motherobjects) {
            // Compute a position for this object based on the time.
            var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
            matrix = m4.translate(matrix, Motherobjects.translation[0], Motherobjects.translation[1], Motherobjects.translation[2]);
            matrix = m4.scale(matrix, Motherobjects.scale[0], Motherobjects.scale[1], Motherobjects.scale[2]);
            matrix = m4.xRotate(matrix, Motherobjects.rotation[0]);
            matrix = m4.yRotate(matrix, Motherobjects.rotation[1]);
            matrix = m4.zRotate(matrix, Motherobjects.rotation[2]* time * 10);
            updateChildren(Motherobjects);
        
            var worldMatrix = matrix;
            var worldViewProjectionMatrix = worldMatrix;
        
            gl.uniformMatrix4fv(
              worldViewProjectionLocation, false,
              worldViewProjectionMatrix);
            gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
    
            gl.uniform4fv(colorLocation, [0.5, 0.5, 0.5, 1]); 
            gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
        
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 36;
            gl.drawArrays(primitiveType, offset, count);

            Motherobjects.childObject.forEach(function(childObject) {
              var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
              matrix = m4.translate(matrix, childObject.translation[0], childObject.translation[1], childObject.translation[2]);
              matrix = m4.scale(matrix, childObject.scale[0], childObject.scale[1], childObject.scale[2]);
              matrix = m4.xRotate(matrix,childObject.rotation[0]);
              matrix = m4.yRotate(matrix, childObject.rotation[1]);
              matrix = m4.zRotate(matrix, childObject.rotation[2]);
          
              var worldMatrix = matrix;
              var worldViewProjectionMatrix = worldMatrix;
          
              gl.uniformMatrix4fv(
                worldViewProjectionLocation, false,
                worldViewProjectionMatrix);
              gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
      
              gl.uniform4fv(colorLocation, [0.5, 0.5, 0.5, 1]); 
              gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
          
              var primitiveType = gl.TRIANGLES;
              var offset = 0;
              var count = 36;
              gl.drawArrays(primitiveType, offset, count);
            });
            checkWebGLError(gl);
        });
        requestAnimationFrame(drawScene);
    }
  }


function checkWebGLError(gl) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
    }
}

const positions = [
    // Front face
    -20, -20,  20,
    20, -20,  20,
    -20,  20,  20,
    20, -20,  20,
    20,  20,  20,
    -20,  20,  20,

    // Back face
    -20, -20, -20,
    -20,  20, -20,
    20, -20, -20,
    -20,  20, -20,
    20,  20, -20,
    20, -20, -20,

    // Top face
    -20,  20, -20,
    -20,  20,  20,
    20,  20, -20,
    -20,  20,  20,
    20,  20,  20,
    20,  20, -20,

    // Bottom face
    -20, -20, -20,
    20, -20, -20,
    -20, -20,  20,
    20, -20, -20,
    20, -20,  20,
    -20, -20,  20,

    // Right face
    20, -20, -20,
    20,  20, -20,
    20, -20,  20,
    20,  20, -20,
    20,  20,  20,
    20, -20,  20,

    // Left face
    -20, -20, -20,
    -20, -20,  20,
    -20,  20, -20,
    -20, -20,  20,
    -20,  20,  20,
    -20,  20, -20,
];
const normals = [
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
];

const texcoords = [
    // Front face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Top face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Bottom face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Right face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Left face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
];

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

// Function to create a position buffer
function createPositionBuffer(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

// Function to create a normal buffer
function createNormalBuffer(gl) {
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    return normalBuffer;
}

// Function to create a texture coordinate buffer
function createTexcoordBuffer(gl) {
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    return texcoordBuffer;
}

function transformPoint(matrix, point) {
  // Convert the 3D point to a 4D point (homogeneous coordinates)
  var point4d = [point[0], point[1], point[2], 1];

  // Apply the transformation matrix to the 4D point
  var transformedPoint = [
      matrix[0] * point4d[0] + matrix[4] * point4d[1] + matrix[8] * point4d[2] + matrix[12] * point4d[3],
      matrix[1] * point4d[0] + matrix[5] * point4d[1] + matrix[9] * point4d[2] + matrix[13] * point4d[3],
      matrix[2] * point4d[0] + matrix[6] * point4d[1] + matrix[10] * point4d[2] + matrix[14] * point4d[3],
      matrix[3] * point4d[0] + matrix[7] * point4d[1] + matrix[11] * point4d[2] + matrix[15] * point4d[3]
  ];

  // Convert back to 3D point, if the w component is not 1
  if (transformedPoint[3] !== 1) {
      transformedPoint[0] /= transformedPoint[3];
      transformedPoint[1] /= transformedPoint[3];
      transformedPoint[2] /= transformedPoint[3];
  }

  return [transformedPoint[0], transformedPoint[1], transformedPoint[2]];
}


var m4 = {
    identity: function() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    },
    normalize: function normalize(v, dst) {
      dst = dst || new Float32Array(3);
      var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      // make sure we don't divide by 0.
      if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
      }
      return dst;
    },
  
    projection: function(width, height, depth) {
      // Note: This matrix flips the Y axis so 0 is at the top.
      return [
         2 / width, 0, 0, 0,
         0, -2 / height, 0, 0,
         0, 0, 2 / depth, 0,
        -1, 1, 0, 1,
      ];
    },
  
    multiply: function(a, b) {
      var a00 = a[0 * 4 + 0];
      var a01 = a[0 * 4 + 1];
      var a02 = a[0 * 4 + 2];
      var a03 = a[0 * 4 + 3];
      var a10 = a[1 * 4 + 0];
      var a11 = a[1 * 4 + 1];
      var a12 = a[1 * 4 + 2];
      var a13 = a[1 * 4 + 3];
      var a20 = a[2 * 4 + 0];
      var a21 = a[2 * 4 + 1];
      var a22 = a[2 * 4 + 2];
      var a23 = a[2 * 4 + 3];
      var a30 = a[3 * 4 + 0];
      var a31 = a[3 * 4 + 1];
      var a32 = a[3 * 4 + 2];
      var a33 = a[3 * 4 + 3];
      var b00 = b[0 * 4 + 0];
      var b01 = b[0 * 4 + 1];
      var b02 = b[0 * 4 + 2];
      var b03 = b[0 * 4 + 3];
      var b10 = b[1 * 4 + 0];
      var b11 = b[1 * 4 + 1];
      var b12 = b[1 * 4 + 2];
      var b13 = b[1 * 4 + 3];
      var b20 = b[2 * 4 + 0];
      var b21 = b[2 * 4 + 1];
      var b22 = b[2 * 4 + 2];
      var b23 = b[2 * 4 + 3];
      var b30 = b[3 * 4 + 0];
      var b31 = b[3 * 4 + 1];
      var b32 = b[3 * 4 + 2];
      var b33 = b[3 * 4 + 3];
      return [
        b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
        b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
        b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
        b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
        b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
        b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
        b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
        b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
        b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
        b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
        b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
        b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
        b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
        b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
        b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
        b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
      ];
    },
  
    translation: function(tx, ty, tz) {
      return [
         1,  0,  0,  0,
         0,  1,  0,  0,
         0,  0,  1,  0,
         tx, ty, tz, 1,
      ];
    },
  
    xRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
  
      return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
      ];
    },
  
    yRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
  
      return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
      ];
    },
  
    zRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
  
      return [
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1,
      ];
    },
  
    scaling: function(sx, sy, sz) {
      return [
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1,
      ];
    },
  
    translate: function(m, tx, ty, tz) {
      return m4.multiply(m, m4.translation(tx, ty, tz));
    },
  
    xRotate: function(m, angleInRadians) {
      return m4.multiply(m, m4.xRotation(angleInRadians));
    },
  
    yRotate: function(m, angleInRadians) {
      return m4.multiply(m, m4.yRotation(angleInRadians));
    },
  
    zRotate: function(m, angleInRadians) {
      return m4.multiply(m, m4.zRotation(angleInRadians));
    },
  
    scale: function(m, sx, sy, sz) {
      return m4.multiply(m, m4.scaling(sx, sy, sz));
    },
  
  };

  function setupAttribute(gl, program, attributeName, buffer, numComponents) {
    var attributeLocation = gl.getAttribLocation(program, attributeName);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attributeLocation, numComponents, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributeLocation);
}
  
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
  
    console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
    gl.deleteProgram(program);
    return undefined;
  }
main();
