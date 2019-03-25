"use strict";
const Texture3D = function (gl, mediaFileUrl,
    width, height, depth) {
    this.width = width || 64;
    this.height = height || 64;
    this.depth = depth || 64;
    gl.pendingResources[mediaFileUrl] = ++gl.pendingResources[mediaFileUrl] || 1;
    this.mediaFileUrl = mediaFileUrl;
    this.glTexture = gl.createTexture();
    this.image = new Image();
    this.image.onload = () => this.loaded(gl);
    this.image.src = mediaFileUrl;
};

Texture3D.prototype.loaded = function (gl) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    context.drawImage(this.image, 0, 0);
    const imageData = context.getImageData(0, 0,
        this.image.width, this.image.height);
    const data3d = new Uint8Array(256 * 256 * 256);
    for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 256; j++) {
            for (let k = 0; k < 256; k++) {
                data3d[i + 256 * (j + 256 * k)] =
                    imageData.data[(i + 4096 * j + 256 * (k % 16) +
                        4096 * 256 * Math.floor(k / 16)) * 4];
            }
        }
    }

    gl.bindTexture(gl.TEXTURE_3D, this.glTexture);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8,
        this.width, this.height, this.depth, 0,
        gl.RED, gl.UNSIGNED_BYTE,
        data3d
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_3D);
    gl.bindTexture(gl.TEXTURE_3D, null);
    if (--gl.pendingResources[this.mediaFileUrl] === 0) {
        delete gl.pendingResources[this.mediaFileUrl];
    }
};
