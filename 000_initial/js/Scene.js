"use strict";
const Scene = function (gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  this.fsShow = new Shader(gl, gl.FRAGMENT_SHADER, "show_fs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.essl");
  this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);
  this.showProgram = new TexturedProgram(gl, this.vsQuad, this.fsShow);
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
  this.traceProgram.rayDirMatrix.set(this.camera.rayDirMatrix);
  this.traceProgram.eyePosition.set(this.camera.position);

  const cylinder = new ClippedQuadric(
    this.traceProgram.quadrics.at(0),
    this.traceProgram.clippers.at(0),
    this.traceProgram.brdfs.at(0),
    this.traceProgram.reflective.at(0));
  cylinder.setUnitCylinder(new Vec3(1, 1, 1), new Vec3(0, 0, 0));
  cylinder.translate(new Vec3(0, 2, 0));

  const green = new ClippedQuadric(
    this.traceProgram.quadrics.at(1),
    this.traceProgram.clippers.at(1),
    this.traceProgram.brdfs.at(1),
    this.traceProgram.reflective.at(1));
  green.setUnitSphere(new Vec3(1, 1, 1), new Vec3(0, 0, 0));
  green.translate(new Vec3(-2, 2, -2));

  const black = new ClippedQuadric(
    this.traceProgram.quadrics.at(2),
    this.traceProgram.clippers.at(2),
    this.traceProgram.brdfs.at(2),
    this.traceProgram.reflective.at(2));
  black.setSik(new Vec3(0.1, 0.4, 0), new Vec3(0, 0, 0));
  black.scale(0.5, 0.5, 0.5);


  const upC = new ClippedQuadric(
    this.traceProgram.quadrics.at(3),
    this.traceProgram.clippers.at(3),
    this.traceProgram.brdfs.at(3),
    this.traceProgram.reflective.at(3));
  upC.setUnitSphere(new Vec3(0, 0, 1), new Vec3(0, 0, 10));
  upC.translate(new Vec3(0, 2, 3));
  upC.scale(0.5);

  const yellowLamp = new ClippedQuadric(
    this.traceProgram.quadrics.at(4),
    this.traceProgram.clippers.at(4),
    this.traceProgram.brdfs.at(4),
    this.traceProgram.reflective.at(4));
  yellowLamp.setUnitSphere(new Vec3(1, 1, 0), new Vec3(3, 3, 0));
  yellowLamp.translate(new Vec3(5, 2, 3));
  yellowLamp.scale(0.5);

  this.traceProgram.lightDirs.at(0).set(new Vec3(1, 1, 0));
  this.traceProgram.background.set(this.background);
  this.quadGeometry.draw();

  this.showProgram.prevImage.set(this.tex[0]);
  this.traceProgram.prevImage.set(this.tex[0]);
  this.traceProgram.frameNumber.set(this.frameNumber);

  // Random

  var crypto = window.crypto || window.msCrypto;
  crypto.getRandomValues(this.randoms);
  let j = 0;
  for (let i = 0; j < 64 && i < 64 * 4; i++) {
    let vec = new Vec4(
      this.randoms[i * 4 + 0] / 4294967295 * 2 - 1,
      this.randoms[i * 4 + 1] / 4294967295 * 2 - 1,
      this.randoms[i * 4 + 2] / 4294967295 * 2 - 1,
      this.randoms[i * 4 + 3] / 4294967295);
    this.traceProgram.randoms.at(j).set(vec);
    //j++;
    //console.log(vec.length());
    if (new Vec3(vec).length() < 1) {
      j++; // elfogadás
    }

  }


  //---

  gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb[1]);

  this.traceProgram.commit();
  this.quadGeometry.draw();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  this.showProgram.commit();
  this.quadGeometry.draw();

  this.tex.reverse();
  this.fb.reverse();
  this.frameNumber += 1;
  if (this.frameNumber > this.frameMax) {
    this.frameNumber = this.frameMax;
  }
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



