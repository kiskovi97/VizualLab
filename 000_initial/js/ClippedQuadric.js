const ClippedQuadric = function (A, B, brdfs, reflective, emission) {
    this.A = A;
    this.B = B;
    this.brdfs = brdfs;
    this.reflective = reflective;
    this.emission = emission;
}

ClippedQuadric.prototype.setUnitSphere = function (color, reflective, emission) {
    this.A.set(1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, -1);
    this.B.set(0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, -1);
    this.brdfs.set(color);
    this.reflective.set(reflective);
    this.emission.set(emission);
}

ClippedQuadric.prototype.setSik = function (color, reflective, emission) {
    this.A.set(0, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, -0.001);
    this.B.set(1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, -50);
    this.brdfs.set(color);
    this.reflective.set(reflective);
    this.emission.set(emission);
}

ClippedQuadric.prototype.setUnitCylinder = function (color, reflective, emission) {
    this.A.set(1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, -30);
    this.B.set(0, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, -10);
    this.brdfs.set(color);
    this.reflective.set(reflective);
    this.emission.set(emission);
}

ClippedQuadric.prototype.transform = function (T) {
    T.invert();
    this.A.premul(T);
    T.transpose();
    this.A.mul(T);
}

ClippedQuadric.prototype.transformB = function (T) {
    T.invert();
    this.B.premul(T);
    T.transpose();
    this.B.mul(T);
}

ClippedQuadric.prototype.translate = function (V) {
    this.transform(new Mat4().translate(V));
}

ClippedQuadric.prototype.translateB = function (V) {
    this.transformB(new Mat4().translate(V));
}


ClippedQuadric.prototype.scale = function (V) {
    this.transform(new Mat4().scale(V));
}