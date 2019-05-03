"use strict";
const Scene = function (gl) {
  this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad_vs.essl");
  this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace_fs.essl");
  this.fsTrance = new Shader(gl, gl.FRAGMENT_SHADER, "transparent_fs.essl");
  this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);
  this.newProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrance);
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
  this.bricktexture = new TextureCube(gl, [
    "media/envMap/right.jpg",
    "media/envMap/left.jpg",
    "media/envMap/up.jpg",
    "media/envMap/down.jpg",
    "media/envMap/center.jpg",
    "media/envMap/back.jpg",]);
  this.volume = new Texture3D(gl, "media/body-at_4096.jpg", 256, 256, 256);
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

  if (keysPressed.R) {
    this.newProgram.eyePosition.set(this.camera.position);
    this.newProgram.rayDirMatrix.set(this.camera.rayDirMatrix);
    this.newProgram.background.set(this.background);
    this.newProgram.volume.set(this.volume);
    this.newProgram.matCap.set(new Vec3(keysPressed.T ? 0 : 1, 2.0, 0));
    this.newProgram.commit();
  } else {
    this.traceProgram.lightDirs.at(0).set(new Vec3(1, 1, 0));
    this.traceProgram.eyePosition.set(this.camera.position);
    this.traceProgram.rayDirMatrix.set(this.camera.rayDirMatrix);
    this.traceProgram.background.set(this.background);
    this.traceProgram.bricktexture.set(this.bricktexture);
    this.traceProgram.volume.set(this.volume);
    this.traceProgram.matCap.set(new Vec3(keysPressed.T ? 0 : 1, 2.0, 0));
    this.traceProgram.commit();
  }

  this.quadGeometry.draw();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Befoglaló: Yx1x1 téglatesten belül szűr
 * Y értéket a matCap változó Y paraméterének beállításával lehet ()
 *
 * Szintfelulet: phong arnyalast hasznaltam default beallitasban
 *
 * Hagymahej: R gomb megnyomasaval bekapcsolhato Transparent mod
 *
 * Onarnyek: A phong arnyalasban benne van
 *
 * MatCap: T gomb megnyomasaval lehet bekapcsolni (Ha nincs lenyomva az R gomb)
 *
 *
 * R : Transparent
 * T : MatCap
 * default : Phong with shadow
 */


