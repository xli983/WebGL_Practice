
function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
    const errFn = opt_errorCallback || error;
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      const lastError = gl.getShaderInfoLog(shader);
      errFn('*** Error compiling shader \'' + shader + '\':' + lastError + `\n` + shaderSource.split('\n').map((l,i) => `${i + 1}: ${l}`).join('\n'));
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }

  
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
  
  function createProgram(
      gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
    const errFn = opt_errorCallback || error;
    const program = gl.createProgram();
    shaders.forEach(function(shader) {
      gl.attachShader(program, shader);
    });
    if (opt_attribs) {
      opt_attribs.forEach(function(attrib, ndx) {
        gl.bindAttribLocation(
            program,
            opt_locations ? opt_locations[ndx] : ndx,
            attrib);
      });
    }
    gl.linkProgram(program);
  
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        const lastError = gl.getProgramInfoLog(program);
        errFn('Error in program linking:' + lastError);
  
        gl.deleteProgram(program);
        return null;
    }
    return program;
  }
  
  function createShaderFromScript(
      gl, scriptId, opt_shaderType, opt_errorCallback) {
    let shaderSource = '';
    let shaderType;
    const shaderScript = document.getElementById(scriptId);
    if (!shaderScript) {
      throw ('*** Error: unknown script element' + scriptId);
    }
    shaderSource = shaderScript.text;
  
    if (!opt_shaderType) {
      if (shaderScript.type === 'x-shader/x-vertex') {
        shaderType = gl.VERTEX_SHADER;
      } else if (shaderScript.type === 'x-shader/x-fragment') {
        shaderType = gl.FRAGMENT_SHADER;
      } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
        throw ('*** Error: unknown shader type');
      }
    }
  
    return loadShader(
        gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
        opt_errorCallback);
  }
  
  const defaultShaderType = [
    'VERTEX_SHADER',
    'FRAGMENT_SHADER',
  ];
  
  function createProgramFromScripts(
      gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
    const shaders = [];
    for (let ii = 0; ii < shaderScriptIds.length; ++ii) {
      shaders.push(createShaderFromScript(
          gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback));
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
  }
  
  function createProgramFromSources(
      gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
    const shaders = [];
    for (let ii = 0; ii < shaderSources.length; ++ii) {
      shaders.push(loadShader(
          gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback));
    }
    return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
  }
  
  function getBindPointForSamplerType(gl, type) {
    if (type === gl.SAMPLER_2D)   return gl.TEXTURE_2D;        // eslint-disable-line
    if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;  // eslint-disable-line
    return undefined;
  }
  
  
  function createUniformSetters(gl, program) {
    let textureUnit = 0;
  
    function createUniformSetter(program, uniformInfo) {
      const location = gl.getUniformLocation(program, uniformInfo.name);
      const type = uniformInfo.type;
      const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
      if (type === gl.FLOAT && isArray) {
        return function(v) {
          gl.uniform1fv(location, v);
        };
      }
      if (type === gl.FLOAT) {
        return function(v) {
          gl.uniform1f(location, v);
        };
      }
      if (type === gl.FLOAT_VEC2) {
        return function(v) {
          gl.uniform2fv(location, v);
        };
      }
      if (type === gl.FLOAT_VEC3) {
        return function(v) {
          gl.uniform3fv(location, v);
        };
      }
      if (type === gl.FLOAT_VEC4) {
        return function(v) {
          gl.uniform4fv(location, v);
        };
      }
      if (type === gl.INT && isArray) {
        return function(v) {
          gl.uniform1iv(location, v);
        };
      }
      if (type === gl.INT) {
        return function(v) {
          gl.uniform1i(location, v);
        };
      }
      if (type === gl.INT_VEC2) {
        return function(v) {
          gl.uniform2iv(location, v);
        };
      }
      if (type === gl.INT_VEC3) {
        return function(v) {
          gl.uniform3iv(location, v);
        };
      }
      if (type === gl.INT_VEC4) {
        return function(v) {
          gl.uniform4iv(location, v);
        };
      }
      if (type === gl.BOOL) {
        return function(v) {
          gl.uniform1iv(location, v);
        };
      }
      if (type === gl.BOOL_VEC2) {
        return function(v) {
          gl.uniform2iv(location, v);
        };
      }
      if (type === gl.BOOL_VEC3) {
        return function(v) {
          gl.uniform3iv(location, v);
        };
      }
      if (type === gl.BOOL_VEC4) {
        return function(v) {
          gl.uniform4iv(location, v);
        };
      }
      if (type === gl.FLOAT_MAT2) {
        return function(v) {
          gl.uniformMatrix2fv(location, false, v);
        };
      }
      if (type === gl.FLOAT_MAT3) {
        return function(v) {
          gl.uniformMatrix3fv(location, false, v);
        };
      }
      if (type === gl.FLOAT_MAT4) {
        return function(v) {
          gl.uniformMatrix4fv(location, false, v);
        };
      }
      if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
        const units = [];
        for (let ii = 0; ii < info.size; ++ii) {
          units.push(textureUnit++);
        }
        return function(bindPoint, units) {
          return function(textures) {
            gl.uniform1iv(location, units);
            textures.forEach(function(texture, index) {
              gl.activeTexture(gl.TEXTURE0 + units[index]);
              gl.bindTexture(bindPoint, texture);
            });
          };
        }(getBindPointForSamplerType(gl, type), units);
      }
      if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
        return function(bindPoint, unit) {
          return function(texture) {
            gl.uniform1i(location, unit);
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(bindPoint, texture);
          };
        }(getBindPointForSamplerType(gl, type), textureUnit++);
      }
      throw ('unknown type: 0x' + type.toString(16)); // we should never get here.
    }
  
    const uniformSetters = { };
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  
    for (let ii = 0; ii < numUniforms; ++ii) {
      const uniformInfo = gl.getActiveUniform(program, ii);
      if (!uniformInfo) {
        break;
      }
      let name = uniformInfo.name;
      // remove the array suffix.
      if (name.substr(-3) === '[0]') {
        name = name.substr(0, name.length - 3);
      }
      const setter = createUniformSetter(program, uniformInfo);
      uniformSetters[name] = setter;
    }
    return uniformSetters;
  }
  function setUniforms(setters, ...values) {
    setters = setters.uniformSetters || setters;
    for (const uniforms of values) {
      Object.keys(uniforms).forEach(function(name) {
        const setter = setters[name];
        if (setter) {
          setter(uniforms[name]);
        }
      });
    }
  }
  
  function createAttributeSetters(gl, program) {
    const attribSetters = {
    };
  
    function createAttribSetter(index) {
      return function(b) {
          if (b.value) {
            gl.disableVertexAttribArray(index);
            switch (b.value.length) {
              case 4:
                gl.vertexAttrib4fv(index, b.value);
                break;
              case 3:
                gl.vertexAttrib3fv(index, b.value);
                break;
              case 2:
                gl.vertexAttrib2fv(index, b.value);
                break;
              case 1:
                gl.vertexAttrib1fv(index, b.value);
                break;
              default:
                throw new Error('the length of a float constant value must be between 1 and 4!');
            }
          } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(
                index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
          }
        };
    }
  
    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let ii = 0; ii < numAttribs; ++ii) {
      const attribInfo = gl.getActiveAttrib(program, ii);
      if (!attribInfo) {
        break;
      }
      const index = gl.getAttribLocation(program, attribInfo.name);
      attribSetters[attribInfo.name] = createAttribSetter(index);
    }
  
    return attribSetters;
  }
  
  function setAttributes(setters, attribs) {
    setters = setters.attribSetters || setters;
    Object.keys(attribs).forEach(function(name) {
      const setter = setters[name];
      if (setter) {
        setter(attribs[name]);
      }
    });
  }
  
  function createVAOAndSetAttributes(gl, setters, attribs, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    setAttributes(setters, attribs);
    if (indices) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    }
    gl.bindVertexArray(null);
    return vao;
  }
  
  function createVAOFromBufferInfo(gl, programInfo, bufferInfo) {
    return createVAOAndSetAttributes(gl, programInfo.attribSetters || programInfo, bufferInfo.attribs, bufferInfo.indices);
  }
  
  function createProgramInfo(
      gl, program) {
    const uniformSetters = createUniformSetters(gl, program);
    const attribSetters = createAttributeSetters(gl, program);
    return {
      program: program,
      uniformSetters: uniformSetters,
      attribSetters: attribSetters,
    };
  }
  
  
  function setBuffersAndAttributes(gl, setters, buffers) {
    setAttributes(setters, buffers.attribs);
    if (buffers.indices) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    }
  }
  
  // Add your prefix here.
  const browserPrefixes = [
    '',
    'MOZ_',
    'OP_',
    'WEBKIT_',
  ];
  
  
  function getExtensionWithKnownPrefixes(gl, name) {
    for (let ii = 0; ii < browserPrefixes.length; ++ii) {
      const prefixedName = browserPrefixes[ii] + name;
      const ext = gl.getExtension(prefixedName);
      if (ext) {
        return ext;
      }
    }
    return undefined;
  }
  
  function resizeCanvasToDisplaySize(canvas, multiplier) {
    multiplier = multiplier || 1;
    const width  = canvas.clientWidth  * multiplier | 0;
    const height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width ||  canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
      return true;
    }
    return false;
  }
  
  function augmentTypedArray(typedArray, numComponents) {
    let cursor = 0;
    typedArray.push = function() {
      for (let ii = 0; ii < arguments.length; ++ii) {
        const value = arguments[ii];
        if (value instanceof Array || (value.buffer && value.buffer instanceof ArrayBuffer)) {
          for (let jj = 0; jj < value.length; ++jj) {
            typedArray[cursor++] = value[jj];
          }
        } else {
          typedArray[cursor++] = value;
        }
      }
    };
    typedArray.reset = function(opt_index) {
      cursor = opt_index || 0;
    };
    typedArray.numComponents = numComponents;
    Object.defineProperty(typedArray, 'numElements', {
      get: function() {
        return this.length / this.numComponents | 0;
      },
    });
    return typedArray;
  }
  
  
  function createAugmentedTypedArray(numComponents, numElements, opt_type) {
    const Type = opt_type || Float32Array;
    return augmentTypedArray(new Type(numComponents * numElements), numComponents);
  }
  
  function createBufferFromTypedArray(gl, array, type, drawType) {
    type = type || gl.ARRAY_BUFFER;
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
    return buffer;
  }
  
  function allButIndices(name) {
    return name !== 'indices';
  }
  
  function createMapping(obj) {
    const mapping = {};
    Object.keys(obj).filter(allButIndices).forEach(function(key) {
      mapping['a_' + key] = key;
    });
    return mapping;
  }
  
  function getGLTypeForTypedArray(gl, typedArray) {
    if (typedArray instanceof Int8Array)    { return gl.BYTE; }            // eslint-disable-line
    if (typedArray instanceof Uint8Array)   { return gl.UNSIGNED_BYTE; }   // eslint-disable-line
    if (typedArray instanceof Int16Array)   { return gl.SHORT; }           // eslint-disable-line
    if (typedArray instanceof Uint16Array)  { return gl.UNSIGNED_SHORT; }  // eslint-disable-line
    if (typedArray instanceof Int32Array)   { return gl.INT; }             // eslint-disable-line
    if (typedArray instanceof Uint32Array)  { return gl.UNSIGNED_INT; }    // eslint-disable-line
    if (typedArray instanceof Float32Array) { return gl.FLOAT; }           // eslint-disable-line
    throw 'unsupported typed array type';
  }
  
  function getNormalizationForTypedArray(typedArray) {
    if (typedArray instanceof Int8Array)    { return true; }  // eslint-disable-line
    if (typedArray instanceof Uint8Array)   { return true; }  // eslint-disable-line
    return false;
  }
  
  function isArrayBuffer(a) {
    return a.buffer && a.buffer instanceof ArrayBuffer;
  }
  
  function guessNumComponentsFromName(name, length) {
    let numComponents;
    if (name.indexOf('coord') >= 0) {
      numComponents = 2;
    } else if (name.indexOf('color') >= 0) {
      numComponents = 4;
    } else {
      numComponents = 3;  // position, normals, indices ...
    }
  
    if (length % numComponents > 0) {
      throw 'can not guess numComponents. You should specify it.';
    }
  
    return numComponents;
  }
  
  function makeTypedArray(array, name) {
    if (isArrayBuffer(array)) {
      return array;
    }
  
    if (array.data && isArrayBuffer(array.data)) {
      return array.data;
    }
  
    if (Array.isArray(array)) {
      array = {
        data: array,
      };
    }
  
    if (!array.numComponents) {
      array.numComponents = guessNumComponentsFromName(name, array.length);
    }
  
    let type = array.type;
    if (!type) {
      if (name === 'indices') {
        type = Uint16Array;
      }
    }
    const typedArray = createAugmentedTypedArray(array.numComponents, array.data.length / array.numComponents | 0, type);
    typedArray.push(array.data);
    return typedArray;
  }
  
  function createAttribsFromArrays(gl, arrays, opt_mapping) {
    const mapping = opt_mapping || createMapping(arrays);
    const attribs = {};
    Object.keys(mapping).forEach(function(attribName) {
      const bufferName = mapping[attribName];
      const origArray = arrays[bufferName];
      if (origArray.value) {
        attribs[attribName] = {
          value: origArray.value,
        };
      } else {
        const array = makeTypedArray(origArray, bufferName);
        attribs[attribName] = {
          buffer:        createBufferFromTypedArray(gl, array),
          numComponents: origArray.numComponents || array.numComponents || guessNumComponentsFromName(bufferName),
          type:          getGLTypeForTypedArray(gl, array),
          normalize:     getNormalizationForTypedArray(array),
        };
      }
    });
    return attribs;
  }
  
  function getArray(array) {
    return array.length ? array : array.data;
  }
  
  function getNumComponents(array, arrayName) {
    return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
  }
  const positionKeys = ['position', 'positions', 'a_position'];
  function getNumElementsFromNonIndexedArrays(arrays) {
    let key;
    for (const k of positionKeys) {
      if (k in arrays) {
        key = k;
        break;
      }
    }
    key = key || Object.keys(arrays)[0];
    const array = arrays[key];
    const length = getArray(array).length;
    const numComponents = getNumComponents(array, key);
    const numElements = length / numComponents;
    if (length % numComponents > 0) {
      throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
    }
    return numElements;
  }
  
  function createBufferInfoFromArrays(gl, arrays, opt_mapping) {
    const bufferInfo = {
      attribs: createAttribsFromArrays(gl, arrays, opt_mapping),
    };
    let indices = arrays.indices;
    if (indices) {
      indices = makeTypedArray(indices, 'indices');
      bufferInfo.indices = createBufferFromTypedArray(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
      bufferInfo.numElements = indices.length;
    } else {
      bufferInfo.numElements = getNumElementsFromNonIndexedArrays(arrays);
    }
  
    return bufferInfo;
  }
  
  function createBuffersFromArrays(gl, arrays) {
    const buffers = { };
    Object.keys(arrays).forEach(function(key) {
      const type = key === 'indices' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
      const array = makeTypedArray(arrays[key], name);
      buffers[key] = createBufferFromTypedArray(gl, array, type);
    });
  
    if (arrays.indices) {
      buffers.numElements = arrays.indices.length;
    } else if (arrays.position) {
      buffers.numElements = arrays.position.length / 3;
    }
  
    return buffers;
  }
  
  function drawBufferInfo(gl, bufferInfo, primitiveType, count, offset) {
    const indices = bufferInfo.indices;
    primitiveType = primitiveType === undefined ? gl.TRIANGLES : primitiveType;
    const numElements = count === undefined ? bufferInfo.numElements : count;
    offset = offset === undefined ? 0 : offset;
    if (indices) {
      gl.drawElements(primitiveType, numElements, gl.UNSIGNED_SHORT, offset);
    } else {
      gl.drawArrays(primitiveType, offset, numElements);
    }
  }
  
  function drawObjectList(gl, objectsToDraw) {
    let lastUsedProgramInfo = null;
    let lastUsedBufferInfo = null;
  
    objectsToDraw.forEach(function(object) {
      const programInfo = object.programInfo;
      const bufferInfo = object.bufferInfo;
      let bindBuffers = false;
  
      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        bindBuffers = true;
      }
  
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        setBuffersAndAttributes(gl, programInfo.attribSetters, bufferInfo);
      }
      setUniforms(programInfo.uniformSetters, object.uniforms);
      drawBufferInfo(gl, bufferInfo);
    });
  }

  function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); 
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
  
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
  
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         gl.generateMipmap(gl.TEXTURE_2D);
      } else {
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;
  
    return texture;
  }
  
  function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }

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
  
  