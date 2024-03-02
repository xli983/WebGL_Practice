"use strict";

const vs = `#version 300 es
  in vec4 a_position;
  in vec4 a_weight;
  in vec4 a_boneNdx;
  
  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 bones[4];
  
  out vec4 v_color;
  
  void main() {
      gl_Position = projection * view *
                    (bones[int(a_boneNdx.x)] * a_position * a_weight.x +
                     bones[int(a_boneNdx.y)] * a_position * a_weight.y +
                     bones[int(a_boneNdx.z)] * a_position * a_weight.z +
                     bones[int(a_boneNdx.w)] * a_position * a_weight.w);
  }
  `;
  const fs = `#version 300 es
  precision mediump float;
  uniform vec4 color;
  
  out vec4 outColor;
  
  void main() {
      outColor = color;
  }
  `;
  const vs2 = `#version 300 es
  in vec4 a_position;
  
  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;
  
  void main() {
      gl_Position = projection * view * model * a_position;
  }
  `;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  var program = createProgram(gl, vertexShader, fragmentShader);
  var programInfo = createProgramInfo(gl, program);

  var arrays = {
    position: {
      numComponents: 3,
      data: [
       0,  1,  -1,// 0
       0, -1,  -1,// 1
       0,  1,  1,// 2
       0, -1,  1,// 3
       2,  1,  -1,// 4
       2, -1,  -1,// 5
       2,  1,  1,// 6
       2, -1,  1,// 7
       4,  1,  -1,// 8
       4, -1,  -1,// 9
       4,  1,  1,// 10
       4, -1,  1,// 11
       6,  1,  -1,// 12
       6, -1,  -1,// 13
       6,  1,  1,// 14
       6, -1,  1,// 15
       8,  1,  -1,// 16
       8, -1,  -1,// 17
       8,  1,  1,// 18
       8, -1,  1,// 19
       10, 1,  -1,// 20
       10, -1,  -1,// 21
       10, 1,  1,// 22
       10, -1,  1,// 23
      ],
    },
    boneNdx: {
      numComponents: 4,
      data: [
        0, 0, 0, 0,  // 0
        0, 0, 0, 0,  // 1
        0, 0, 0, 0,  // 0
        0, 0, 0, 0,  // 1

        0, 1, 0, 0,  // 2
        0, 1, 0, 0,  // 3
        0, 1, 0, 0,  // 2
        0, 1, 0, 0,  // 3

        1, 0, 0, 0,  // 4
        1, 0, 0, 0,  // 5
        1, 0, 0, 0,  // 4
        1, 0, 0, 0,  // 5

        1, 2, 0, 0,  // 6
        1, 2, 0, 0,  // 7
        1, 2, 0, 0,  // 6
        1, 2, 0, 0,  // 7

        2, 0, 0, 0,  // 8
        2, 0, 0, 0,  // 9
        2, 0, 0, 0,  // 8
        2, 0, 0, 0,  // 9

        2, 2, 0, 0,  // 10
        2, 2, 0, 0,  // 11
        2, 2, 0, 0,  // 10
        2, 2, 0, 0,  // 11
      ],
    },
    weight: {
      numComponents: 4,
      data: [
       1, 0, 0, 0,  // 0
       1, 0, 0, 0,  // 1
       1, 0, 0, 0,  // 0
       1, 0, 0, 0,  // 1

      .5,.5, 0, 0,  // 2
      .5,.5, 0, 0,  // 3
      .5,.5, 0, 0,  // 2
      .5,.5, 0, 0,  // 3

       1, 0, 0, 0,  // 4
       1, 0, 0, 0,  // 5
       1, 0, 0, 0,  // 4
       1, 0, 0, 0,  // 5

      .5,.5, 0, 0,  // 6
      .5,.5, 0, 0,  // 7
      .5,.5, 0, 0,  // 6
      .5,.5, 0, 0,  // 7

       1, 0, 0, 0,  // 8
       1, 0, 0, 0,  // 9
       1, 0, 0, 0,  // 8
       1, 0, 0, 0,  // 9

      .5,.5, 0, 0,  //10
      .5,.5, 0, 0,  //11
      .5,.5, 0, 0,  //10
      .5,.5, 0, 0,  //11
      ],
    },

    indices: {
      numComponents: 2,
      data: [
        0, 1,
        0, 2,
        0, 4,
        1, 3,
        1, 5,
        2, 3, 
        2, 6,
        3, 7,//
        4, 5,
        4, 6,
        4, 8,
        5, 7,
        5, 9,
        6, 7,
        6, 10,
        7, 11,//
        8, 9,
        8, 10,
        8, 12,
        9, 11,
        9, 13,
        10, 11,
        10, 14,
        11, 15,//
        12, 13,
        12, 14,
        12, 16,
        13, 15,
        13, 17,
        14, 15,
        14, 18,
        15, 19,//
        16, 17,
        16, 18,
        16, 20,
        17, 19,
        17, 21,
        18, 19,
        18, 22,
        19, 23,//
        20, 21,
        20, 22,
        21, 23,
        22, 23,
      ],
    },
  };
  var bufferInfo = createBufferInfoFromArrays(gl, arrays);

  var numBones = 5;
  var boneArray = new Float32Array(numBones * 16);


  var uniforms = {
    projection: orthographic(-20, 20, -10, 10, -1, 1),
    view: identity(),
    bones: boneArray,
    color: [1, 0, 0, 1],
  };

  var boneMatrices = [];  
  var bones = [];        
  var bindPose = [];   
  for (var i = 0; i < numBones; ++i) {
    boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));
    bindPose.push(identity()); 
    bones.push(identity()); 
  }

   // rotate each bone
   function computeBoneMatrices(bones, angle) {
     var m = identity();
     zRotate(m, angle, bones[0]);
     translate(bones[0], 4, 0, 0, m);
     zRotate(m, angle, bones[1]);
     translate(bones[1], 4, 0, 0, m);
     zRotate(m, angle, bones[2]);
  }

  computeBoneMatrices(bindPose, 0);

  var bindPoseInv = bindPose.map(function(m) {
    return inverse(m);
  });

  function render(time) {
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    orthographic(-aspect * 10, aspect * 10, -10, 10, -1, 1, uniforms.projection);

    var t = time * 0.001;
    var angle = Math.sin(t) * 0.8;
    //var angle = 0;
    computeBoneMatrices(bones, angle);

    var viewmartix = yRotate(identity(), time * 0.001);
    uniforms.view = viewmartix;

    bones.forEach(function(bone, ndx) {
      multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
    });

    gl.useProgram(programInfo.program);
    setBuffersAndAttributes(gl, programInfo, bufferInfo);

    setUniforms(programInfo, uniforms);

    drawBufferInfo(gl, bufferInfo, gl.LINES);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
