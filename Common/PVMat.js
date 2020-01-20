/*
  function PV (isPoint) {		new PV(true)
  function PV (x, y, z, isPoint)	new PV(1, 2, 7, false)
  function PV (x, y, z, w)		new PV(0, 1, 6, 1)
*/
function PV (x, y, z, w) {
    var v = [0, 0, 0, 0];

    if (typeof x === "boolean") {
        // function PV (isPoint)
	if (x)
	    v[3] = 1;
    }
    else if (typeof x === "number" &&
             typeof y === "number" &&
             typeof z === "number") {
	v[0] = x;
	v[1] = y;
	v[2] = z;
	if (typeof w === "number")
            v[3] = w;
        else if (typeof w === "boolean") {
            if (w) 
	        v[3] = 1;
        }
        else
            throw "Illegal Argument";
    }
    else
        throw "Illegal Argument";
    
    v.__proto__ = PV.prototype;

    return v;  
}

PV.prototype = Object.create(Array.prototype);

PV.prototype.constructor = PV;

PV.prototype.toString = function () {
    return "[ " + this[0] + " " + this[1] + " " + this[2] + " " + this[3] + " ]";

}

PV.prototype.isVector = function () {
    return this[3] == 0;
}

PV.prototype.isPoint = function () {
    return this[3] != 0;
}

PV.prototype.flatten = function () {
    var floats = new Float32Array( 4 );
    for (var i = 0; i < 4; i++)
        floats[i] = this[i];
    return floats;
}

function flatten (v) {
    if (!(v[0] instanceof PV))
        throw "Illegal Argument 3";

    var floats = new Float32Array(4 * v.length);

    var n = 0;
    for (var i = 0; i < v.length; i++)
        for (var j = 0; j < 4; j++) {
            floats[n++] = v[i][j];
            // console.log("i " + i + " j " + j + " v[i][j] " + v[i][j]);
        }
    
    return floats;
}        

function Mat(c1, c2, c3, c4) {
    var cols = [ c1, c2, c3, c4 ];
    
    var mat = [new PV(1, 0, 0, 0),
               new PV(0, 1, 0, 0),
               new PV(0, 0, 1, 0),
               new PV(0, 0, 0, 1)];
    
    for (var j = 0; j < 4; j++) {
        if (cols[j] === undefined)
            break;
        if (!(cols[j] instanceof PV))
            throw "Illegal Argument";
        
        for (var i = 0; i < 4; i++)
            mat[i][j] = cols[j][i];
    }
    
    mat.__proto__ = Mat.prototype;

    return mat;
}

Mat.prototype = Object.create(Array.prototype);
Mat.prototype.constructor = Mat;

Mat.prototype.toString = function () {
    return this[0].toString() + "\n" + 
        this[1].toString() + "\n" + 
        this[2].toString() + "\n" + 
        this[3].toString() + "\n";
}

Mat.prototype.flatten = function () {
    var floats = new Float32Array( 16 );
    var n = 0;
    for (var j = 0; j < 4; j++)
        for (var i = 0; i < 4; i++)
            floats[n++] = this[i][j];
    return floats;
}

PV.prototype.plus = function (that) {
    if (that instanceof PV) {
        return new PV(this[0] + that[0],
                      this[1] + that[1],
                      this[2] + that[2],
                      this[3] + that[3]);
    }
    else {
        console.log("illegal argument");
        throw "Illegal Argument";
    }
}

PV.prototype.equal = function (that) {
    if (that instanceof PV) {
        return (this[0] == that[0]) && 
               (this[1] == that[1]) && 
               (this[2] == that[2]) && 
               (this[3] == that[3]) ; 

    }
    else {
        console.log("illegal argument");
        throw "Illegal Argument";
    }
}


// (2, -1, 3, 1) times -2 equals (-4, 2, -6, -2)
// (2, -1, 3, 1) times (3, 2, 5, 0) equals (6, -2, 15, 0)
PV.prototype.times = function (that) {
    if (typeof that === "number") {
        return new PV(this[0] * that,
                      this[1] * that,
                      this[2] * that,
                      this[3] * that);
    }
    if (that instanceof PV) {
        return new PV(this[0] * that[0],
                      this[1] * that[1],
                      this[2] * that[2],
                      this[3] * that[3]);
    }
    else {
        console.log("illegal argument");
        throw "Illegal Argument";
    }
}

// u.minus() = -u
// u.minus(v) = u - v
PV.prototype.minus = function (that) {
    if (that === undefined) {
        // EXERCISE
        return new PV(-this[0], -this[1], -this[2], -this[3]);
    }
    else if (that instanceof PV) {
        // EXERCISE
        return new PV(this[0]-that[0], this[1]-that[1], this[2]-that[2], this[3]-that[3]);
    }
    else {
        console.log("illegal argument");
        throw "Illegal Argument";
    }
}

// Do a 4-dimensional dot product:
// (1, 2, 3, 4) dot (-2, -3, 1, 1) = 1 * -2 + 2 * -3 + 3 * 1 + 4 * 1
PV.prototype.dot = function (that) {
    if (!(that instanceof PV))
        throw "Illegal Argument";
    
    // EXERCISE
    return this[0]*that[0] +this[1]*that[1] + this[2]*that[2] + this[3]*that[3];
}

// Assume inputs are vectors.  Output is a vector.
PV.prototype.cross = function (that) {
    if (!(that instanceof PV))
        throw "Illegal Argument";

    // EXERCISE
    return new PV(this[1]*that[2] - this[2]*that[1], 
                  this[2]*that[0] - this[0]*that[2], 
                  this[0]*that[1] - this[1]*that[0],
                  0);
}

PV.prototype.magnitude = function () {
    // EXERCISE
    // Use dot and Math.sqrt()
    return Math.sqrt(this.dot(this));
};

PV.prototype.distance = function (that) {
    if (!(that instanceof PV))
        throw "Illegal Argument";

    // EXERCISE
    // Use minus and magnitude.
    return this.minus(that).magnitude();
};

// Return unit vector pointing same direction as this.
PV.prototype.unit = function () {
    // EXERCISE
    var l = this.magnitude();
    return new PV(this[0]/l, this[1]/l, this[2]/l, this[3]);
};

// Replace this with unit vector pointing same direction as this.
PV.prototype.unitize = function () {
    // EXERCISE
    var l = this.magnitude();
    this[0] = this[0] / l;
    this[1] = this[1] / l;
    this[2] = this[2] / l;
};

// Return homogeneous point by dividing all coordinates by this[3].
// Does not change this.
PV.prototype.homogeneous = function () {
    if (this[3] == 0)
        return this;
    var p = new PV(true);

    // EXERCISE
    // Set p[0], p[1], p[2]
    p[0] = this[0]/this[3];
    p[1] = this[1]/this[3];
    p[2] = this[2]/this[3];

    return p;
};

// Divide all coordinates by this[3].  Changes this.
PV.prototype.homogenize = function () {
    if (this[3] != 0) {
      // EXERCISE
      this[0] = this[0] / this[3];
      this[1] = this[1] / this[3];
      this[2] = this[2] / this[3];
      this[3] = 1;
    }
};


// Return rotation matrix for rotation by angle about axis i.
// 0: x, 1: y, 2: z
Mat.rotation = function (i, angle) {
    if (i === undefined || angle === undefined ||
        !(typeof i === "number") || !(typeof angle === "number"))
	throw "Illegal Argument";

    var mat = new Mat();

    // EXERCISE
    // Uses Math.sin() and Math.cos()
    // Set j=0 and k=1 and do the i=2 (z-axis) case.
    // Figure out what you need to set j and k equal to for the i=0 and i=1.
    var j=(i+1)%3; var k=(j+1)%3; 
    mat[j][j] = Math.cos(angle);
    mat[j][k] = -Math.sin(angle);
    mat[j][i] = 0;
    mat[k][j] = Math.sin(angle);
    mat[k][k] = Math.cos(angle);
    mat[k][i] = 0;
    mat[i][j] = 0;
    mat[i][k] = 0;
    mat[i][i] = 1;

    return mat;
};

// Create translation matrix for vector v.
Mat.translation = function (v) {
    if (!(v instanceof PV))
	throw "Illegal Argument";

    var mat = new Mat();

    // EXERCISE
    mat[0][3] = v[0];
    mat[1][3] = v[1];
    mat[2][3] = v[2];

    return mat;
};

// Create scale matrix for scalar or vector s.
Mat.scale = function (s) {
    var mat = new Mat();

    if (typeof s === "number") {
        // EXERCISE
        mat[0][0] = s;
        mat[1][1] = s;
        mat[2][2] = s;
    }
    else if (s instanceof PV) {
        // EXERCISE
        mat[0][0] = s[0];
        mat[1][1] = s[1];
        mat[2][2] = s[2];
    }
    else
	throw "Illegal Argument";

    return mat;

};

// Return transpose of matrix.
Mat.prototype.transpose = function() {
    var mat = new Mat();

    // EXERCISE
    for (var i=0; i<4; i++)
        for (var j=0; j<4; j++)
            mat[i][j] = this[j][i];

    return mat;
};

/*
  Matrix multiplication.
  If "that" is a PV, it is treated as a 4 by 1 column vector.
*/
Mat.prototype.times = function (that) {
    if (that instanceof PV) {
        var v = new PV(false);
        
        // EXERCISE
        v[0] = this[0].dot(that); 
        v[1] = this[1].dot(that);
        v[2] = this[2].dot(that);
        v[3] = this[3].dot(that);

        return v;
    }
    else if (that instanceof Mat) {
        var mat = new Mat();
        
        var col0 = new PV(that[0][0], that[1][0], that[2][0], that[3][0]);
        var col1 = new PV(that[0][1], that[1][1], that[2][1], that[3][1]);
        var col2 = new PV(that[0][2], that[1][2], that[2][2], that[3][2]);
        var col3 = new PV(that[0][3], that[1][3], that[2][3], that[3][3]);

        var cols = [col0, col1, col2, col3];

        // EXERCISE
        for (var i=0; i<4; i++)
            for (var j=0; j<4; j++)
                mat[i][j] = this[i].dot(cols[j])

        return mat;
    }
}

