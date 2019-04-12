"use strict";

/**
 * Abstract: Legyen a színtérben legalább egy pontfényforrás. A láthatóságát ellenőrizze árnyéksugarakkal.
 * * Lehetséges pont és irány fényforrásokat is megadni
 * * pl.: this.traceProgram.lights.at(0).set(new Vec4(1, 1, 0, 0));
 *
 * Tükör: Legyen a színtérben olyan felület, ami ideális tükörként veri vissza a fényt.
 * * Be lehet állítani a felületek tükröződését, egyik gömb teljesen tükröződik:
 * * green.setUnitSphere(new Vec3(1, 1, 1), new Vec3(1, 1, 1), new Vec3(0, 0, 0));
 *
 * Törő: Legyen a színtérben olyan felület, ami ideális törő anyagként viselkedik.
 * * Be lehet állítani a felületek transparenciáját, egyik gömb teljesen transparens:
 * * transparentSphere.setTransparent(new Vec4(1, 1, 1, 0.9));
 *
 * Üveg: Legyen olyan felület, ami egyszerre ideális tükörként és ideális törőként is viselkedik.
 * Használjon saját stack-et a rekurzió megvalósítására, vagy válasszon véletlenszerűen a törés és a tükrözés között, és átlagolja a képeket.
 * A reflektancia és transzmittancia lehet fix.
 * * Be lehet állítani a felületek transparenciáját és tükröződését egyszerre, egyik gömbön mindkettő be van állítva:
 * * glassSphere.setUnitSphere(new Vec3(0, 0, 1), new Vec3(0.8, 0.9, 1), new Vec4(0, 0, 0, 0));
 * * glassSphere.setTransparent(new Vec4(0.8, 0.9, 1, 0.9));
 *
 * Monte-Carlo: Legyenek a színtérben diffúz felületek. A kimenő radianciát becsülje véletlen bejövő irány alapján. A képeket átlagolja.
 * * az emission 4-dik paraméterére lehet beállítani. Ha 0-nál nagyobb, akkor diffúz módszerrel számolja a felületet (csak azzal)
 * * monteCarlo.setUnitSphere(new Vec3(0, 0, 0), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 1));
 *
 * Területi: legyenek a színtérben egy emisszív felület (pl. egy hengerpalást, amit könnyű mintavételezni 1D egyenletes elosztású véletlenszámok birtokában,
 * vagy egy gömb, amit a gömbben vagy gömbfelületen egyenletes eloszlású véletlenszámokkal lehet jól mintavételezni).
 * A felületi pontok árnyalásakor a fényforrást  véletlenszerűen mintavételezze és a minta láthatóságát árnyéksugárral
 * ellenőrizze (next event estimation). A képeket átlagolja.
 * * Hozzá lehet adni világító gömböket (a scene-ben nem jelenik meg, csak a hatása érződik (árnyékok és fény))
 * * Az első 3 koordináta a pozíció, a 4dik pedig a sugara
 * * this.traceProgram.lightSpheres.at(0).set(new Vec4(0, 1, 0, 0.1));
 */

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
  this.frameMax = 100;
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
    this.traceProgram.reflective.at(0),
    this.traceProgram.emission.at(0),
    this.traceProgram.transparent.at(0));
  cylinder.setUnitCylinder(new Vec3(1, 1, 1), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 0));
  cylinder.translate(new Vec3(0, 2, 0));
  cylinder.setTransparent(new Vec4(0, 0, 0, 0));

  const green = new ClippedQuadric(
    this.traceProgram.quadrics.at(1),
    this.traceProgram.clippers.at(1),
    this.traceProgram.brdfs.at(1),
    this.traceProgram.reflective.at(1),
    this.traceProgram.emission.at(1),
    this.traceProgram.transparent.at(1));
  green.setUnitSphere(new Vec3(1, 1, 1), new Vec3(1, 1, 1), new Vec4(0, 0, 0, 0));
  green.translate(new Vec3(-2, 2, -2));
  green.setTransparent(new Vec4(0, 0, 0, 0));

  const sik = new ClippedQuadric(
    this.traceProgram.quadrics.at(2),
    this.traceProgram.clippers.at(2),
    this.traceProgram.brdfs.at(2),
    this.traceProgram.reflective.at(2),
    this.traceProgram.emission.at(2),
    this.traceProgram.transparent.at(2));
  sik.setSik(new Vec3(0, 1, 1), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 0));
  sik.scale(0.5, 0.5, 0.5);
  sik.setTransparent(new Vec4(0, 0, 0, 0));


  const glassSphere = new ClippedQuadric(
    this.traceProgram.quadrics.at(3),
    this.traceProgram.clippers.at(3),
    this.traceProgram.brdfs.at(3),
    this.traceProgram.reflective.at(3),
    this.traceProgram.emission.at(3),
    this.traceProgram.transparent.at(3));
  glassSphere.setUnitSphere(new Vec3(0, 0, 1), new Vec3(0.8, 0.9, 1), new Vec4(0, 0, 0, 0));
  glassSphere.scale(2);
  glassSphere.translate(new Vec3(0, 7, 3));
  glassSphere.setTransparent(new Vec4(0.8, 0.9, 1, 0.9));

  const yellowSphere = new ClippedQuadric(
    this.traceProgram.quadrics.at(4),
    this.traceProgram.clippers.at(4),
    this.traceProgram.brdfs.at(4),
    this.traceProgram.reflective.at(4),
    this.traceProgram.emission.at(4),
    this.traceProgram.transparent.at(4));
  yellowSphere.setUnitSphere(new Vec3(1, 1, 0), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 0));
  yellowSphere.scale(1);
  yellowSphere.translate(new Vec3(2, 1, -1));
  yellowSphere.setTransparent(new Vec4(0, 0, 0, 0));

  const monteCarlo = new ClippedQuadric(
    this.traceProgram.quadrics.at(5),
    this.traceProgram.clippers.at(5),
    this.traceProgram.brdfs.at(5),
    this.traceProgram.reflective.at(5),
    this.traceProgram.emission.at(5),
    this.traceProgram.transparent.at(5));
  monteCarlo.setUnitSphere(new Vec3(0, 0, 0), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 1));
  monteCarlo.scale(1.5);
  monteCarlo.translate(new Vec3(0, 1, -2));
  monteCarlo.setTransparent(new Vec4(0, 0, 0, 0));

  const transparentSphere = new ClippedQuadric(
    this.traceProgram.quadrics.at(6),
    this.traceProgram.clippers.at(6),
    this.traceProgram.brdfs.at(6),
    this.traceProgram.reflective.at(6),
    this.traceProgram.emission.at(6),
    this.traceProgram.transparent.at(6));
  transparentSphere.setUnitSphere(new Vec3(1, 1, 0), new Vec3(0, 0, 0), new Vec4(0, 0, 0, 0));
  transparentSphere.scale(1.5);
  transparentSphere.translate(new Vec3(0, 2, 2));
  transparentSphere.setTransparent(new Vec4(1, 1, 1, 0.9));

  this.traceProgram.lights.at(0).set(new Vec4(1, 1, 0, 0));
  this.traceProgram.lights.at(1).set(new Vec4(0, 4, 0, 1));
  this.traceProgram.lightSpheres.at(0).set(new Vec4(0, 1, 0, 0.1));
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



