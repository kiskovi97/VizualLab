"use strict";
const TexturedProgram = function(gl, vertexShader, fragmentShader) {
  this.gl = gl;
  this.sourceFileNames = {vs:vertexShader.sourceFileName, fs:fragmentShader.sourceFileName};
  this.glProgram = gl.createProgram();
  gl.attachShader(this.glProgram, vertexShader.glShader);
  gl.attachShader(this.glProgram, fragmentShader.glShader);

  gl.bindAttribLocation(this.glProgram, 0, 'vertexPosition');
  gl.bindAttribLocation(this.glProgram, 1, 'vertexNormal');
  gl.bindAttribLocation(this.glProgram, 2, 'vertexTexCoord');

  gl.linkProgram(this.glProgram);
  if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
    throw new Error('Could not link shaders [vertex shader:' + vertexShader.sourceFileName + ']:[fragment shader: ' + fragmentShader.sourceFileName + ']\n' + gl.getProgramInfoLog(this.glProgram));
  }

  return UniformReflection.addProperties(this.gl, this.glProgram, this);
  
};

TexturedProgram.prototype.commit = function(){
	this.gl.useProgram(this.glProgram);
  UniformReflection.commitProperties(this.gl, this.glProgram, this);
};

