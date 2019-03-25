"use strict";
const Scene = function (gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  //this.fsShow = new Shader(gl, gl.FRAGMENT_SHADER, "show_fs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.essl");
  this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);
  //this.showProgram = new TexturedProgram(gl, this.vsQuad, this.fsShow);
  this.quadGeometry = new TexturedQuadGeometry(gl);

  this.timeAtFirstFrame = new Date().getTime();
  this.timeAtLastFrame = this.timeAtFirstFrame;

  this.camera = new PerspectiveCamera();
  this.background = new TextureCube(gl, [
    "media/posx.jpg",
    "media/negx.jpg",
    "media/posy.jpg",
    "media/negy.jpg",
    "media/posz.jpg",
    "media/negz.jpg",]);
  this.volume = new Texture3D(gl, "media/brain.jpg");
  this.tex = [];
  this.fb = [];
  this.frameNumber = 1;
  this.randoms = new Uint32Array(64 * 4);
  this.frameMax = 1;
};

Scene.prototype.update = function (gl, keysPressed) {
  //jshint bitwise:false
  //jshint unused:false
  const timeAtThisFrame = new Date().getTime();
  const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
  const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
  this.timeAtLastFrame = timeAtThisFrame;

  // clear the screen
  gl.clearColor(0.3, 0.0, 0.3, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.clearColor(0.6, 0.0, 0.3, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.camera.move(dt, keysPressed);
  this.traceProgram.eyePosition.set(this.camera.position);
  this.traceProgram.rayDirMatrix.set(this.camera.rayDirMatrix);
  this.traceProgram.background.set(this.background);
  this.traceProgram.volume.set(this.volume);
  //this.quadGeometry.draw();
  this.traceProgram.commit();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

Scene.prototype.resize = function (gl, width, height) {
  this.fb = [gl.createFramebuffer(), gl.createFramebuffer()];
  this.tex = [gl.createTexture(), gl.createTexture()];
  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width,
      height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
      this.tex[i], 0);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  this.frameNumber = 1;
};



