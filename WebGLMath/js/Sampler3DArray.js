/**
 * @file WebGLMath Sampler3DArray class
 * @copyright Laszlo Szecsi 2017
 */
"use strict";
/**
 * @class Sampler3DArray
 * @classdesc Array of 2d samplers. May reflect an ESSL array-of-sampler3Ds uniform variable.
 * <BR> Individual [Sampler3D]{@link Sampler3D} elements are available through the index operator [].
 * @param {Number} size - The number of Sampler3D elements in the array.
 * @constructor
 */
const Sampler3DArray = function(size, baseTextureUnit){
  this.length = size;
  this.storage = new Int32Array(size);
  for(let i=0; i<size; i++){
    const element = Object.create(Sampler3D.prototype);
    element.glTexture = null;
    element.storage = this.storage.subarray(i, (i+1));
    Object.defineProperty(this, i, {value: element} );
  }
};

/**
 * @method at
 * @memberof Sampler3DArray.prototype  
 * @description Returns a Sampler3D object that captures an element of the array. The sampler is a view on the original data, not a copy.
 * @param index {Number} - Index of the element.
 * @return {SamplerCube} view on one of the array's elements
 */
Sampler3DArray.prototype.at = function(index){
  return this[index];
};

/**
 * @method set
 * @memberof Sampler3DArray.prototype  
 * @description Assigns textures.
 * @param {Object[] | WebGLTexture[]} textureArray - An array of WebGL textures, or of objects with the `glTexture` property that stores a WebGL texture.
 */
Sampler3DArray.prototype.set = function(textureArray){
  for(let i=0; i<this.size; i++){
    this[i].set(textureArray[ Math.min(i, textureArray.length) ]);
  }
};

/**
 * @method commit
 * @memberof Sampler3DArray.prototype  
 * @description Specifies, to WebGL, the texture unit indices of all samplers in the array, and binds textures of the array elements.
 * @param {WebGLRenderingContext} gl - rendering context
 * @param {WebGLUniformLocation} uniformLocation - location of the uniform variable in the currently used WebGL program
 * @param {Number} baseTextureUnit - The texture unit index of the first element. Other elements are assigned to texture units contiguously.
 */
Sampler3DArray.prototype.commit = function(gl, uniformLocation, baseTextureUnit){
  for(let i=0; i<this.length; i++) {
    this.storage[i] = baseTextureUnit + i;
    gl.activeTexture(gl.TEXTURE0 + baseTextureUnit + i);
    gl.bindTexture(gl.TEXTURE_3D, this[i].glTexture);
  }
  gl.uniform1iv(uniformLocation, this.storage);
};

