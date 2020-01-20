function Cube (gl) {
    this.verts = [ new PV(0, 0, 0, true),
                   new PV(1, 0, 0, true),
                   new PV(0, 1, 0, true),
                   new PV(1, 1, 0, true),
                   new PV(0, 0, 1, true),
                   new PV(1, 0, 1, true),
                   new PV(0, 1, 1, true),
                   new PV(1, 1, 1, true) ];

    this.faces = [ [0, 1, 5, 4],
                   [0, 4, 6, 2],
                   [0, 2, 3, 1],
                   [7, 3, 2, 6],
                   [7, 6, 4, 5],
                   [7, 5, 1, 3] ];

    var buffers = [];

    for (var i = 0; i < this.faces.length; i++) {
        var fverts = [];
        for (var j = 0; j < this.faces[i].length; j++)
            fverts.push(this.verts[this.faces[i][j]]);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(fverts), gl.STATIC_DRAW);
        buffers.push(buffer);
    }

    this.render = function (gl, program) {
        var vPosition = gl.getAttribLocation(program, "vPosition");

        for (var i = 0; i < this.faces.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, this.faces[i].length);
        }
    }
}
