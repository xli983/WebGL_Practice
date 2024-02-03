function deindexVertices(vertices) {
    const indices = vertices.indices;
    const newVertices = {};
    const numElements = indices.length;
  
    function expandToUnindexed(channel) {
      const srcBuffer = vertices[channel];
      const numComponents = srcBuffer.numComponents;
      const dstBuffer = createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
      for (let ii = 0; ii < numElements; ++ii) {
        const ndx = indices[ii];
        const offset = ndx * numComponents;
        for (let jj = 0; jj < numComponents; ++jj) {
          dstBuffer.push(srcBuffer[offset + jj]);
        }
      }
      newVertices[channel] = dstBuffer;
    }
  
    Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);
  
    return newVertices;
  }
  
  function makeRandomVertexColors(vertices, options) {
    options = options || {};
    const numElements = vertices.position.numElements;
    const vcolors = createAugmentedTypedArray(4, numElements, Uint8Array);
    const rand = options.rand || function(ndx, channel) {
      return channel < 3 ? randInt(256) : 255;
    };
    vertices.color = vcolors;
    if (vertices.indices) {
      for (let ii = 0; ii < numElements; ++ii) {
        vcolors.push(rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3));
      }
    } else {
      const numVertsPerColor = options.vertsPerColor || 3;
      const numSets = numElements / numVertsPerColor;
      for (let ii = 0; ii < numSets; ++ii) {
        const color = [rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3)];
        for (let jj = 0; jj < numVertsPerColor; ++jj) {
          vcolors.push(color);
        }
      }
    }
    return vertices;
  }
  
  const CUBE_FACE_INDICES = [
    [3, 7, 5, 1], 
    [6, 2, 0, 4], 
    [6, 7, 3, 2], 
    [0, 1, 5, 4], 
    [7, 6, 4, 5], 
    [2, 3, 1, 0], 
  ];
  
  function createCubeVertices(size) {
    const k = size / 2;
  
    const cornerVertices = [
      [-k, -k, -k],
      [+k, -k, -k],
      [-k, +k, -k],
      [+k, +k, -k],
      [-k, -k, +k],
      [+k, -k, +k],
      [-k, +k, +k],
      [+k, +k, +k],
    ];
  
    const faceNormals = [
      [+1, +0, +0],
      [-1, +0, +0],
      [+0, +1, +0],
      [+0, -1, +0],
      [+0, +0, +1],
      [+0, +0, -1],
    ];
  
    const uvCoords = [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ];
  
    const numVertices = 6 * 4;
    const positions = createAugmentedTypedArray(3, numVertices);
    const normals   = createAugmentedTypedArray(3, numVertices);
    const texCoords = createAugmentedTypedArray(2 , numVertices);
    const indices   = createAugmentedTypedArray(3, 6 * 2, Uint16Array);
  
    for (let f = 0; f < 6; ++f) {
      const faceIndices = CUBE_FACE_INDICES[f];
      for (let v = 0; v < 4; ++v) {
        const position = cornerVertices[faceIndices[v]];
        const normal = faceNormals[f];
        const uv = uvCoords[v];
        positions.push(position);
        normals.push(normal);
        texCoords.push(uv);
  
      }
      const offset = 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }
  
    return {
      position: positions,
      normal: normals,
      texcoord: texCoords,
      indices: indices,
    };
  }
  
  
  function createCubeWithVertexColorsBufferInfo(gl, size) {
    let vertices = createCubeVertices(size);
    vertices = deindexVertices(vertices);
    vertices = makeRandomVertexColors(vertices, {
      vertsPerColor: 6, 
      rand: function(ndx, channel) {
        return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
      },
    });
  
    return createBufferInfoFromArrays(gl, vertices);
  }
  
  