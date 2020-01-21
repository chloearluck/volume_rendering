var gl;
var texture_program, render_program, program;
var canvas;
var cube;
var model2clip, model2world;
var fb, fb_texture;

var voxel_ims = [];
var voxel_sources = ["teapot.raw.png", "bonsai.raw.png", "foot.raw.png"];
var voxel_index = 0;
var voxel_tex;

var renderview = 3;
var alphaCorrection = 0.08;
var steps = 256;
var camera_dist = 3.5;
var near = 0.1, far = 50.0;
var fov = 0.5; 
var zoom = 1;

var model2object, object2model;
var object2rotated, rotated2object;
var rotated2world, world2rotated;
var world2view, view2world;
var view2proj, proj2view;
var proj2clip, clip2proj;
var clip2canvas, canvas2clip;

var aspect;
var mouseDown, mouseIsDown, lastx, lasty;


function setPerspective () {
    var A = Math.tan(fov/2)/ zoom;
    view2proj = new Mat();
    view2proj[0][0] = 1/A/aspect;
    view2proj[1][1] = 1/A;
    view2proj[2][2] = -(far+near)/(far-near);
    view2proj[2][3] = -2*far*near/(far-near);
    view2proj[3][2] = -1;
    view2proj[3][3] = 0;

    proj2view = new Mat();
    proj2view[0][0] = aspect * A;
    proj2view[1][1] = A;
    proj2view[2][2] = 0;
    proj2view[2][3] = -1;
    proj2view[3][2] = (near-far)/(2*far*near);
    proj2view[3][3] = (far+near)/(2*far*near);

    updateM2C();
}

function updateM2C () {
    model2clip = proj2clip.times(view2proj).times(world2view).times(rotated2world).times(object2rotated).times(model2object);
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    texture_program = initShaders( gl, "texture-vertex-shader", "texture-fragment-shader" );
    render_program = initShaders( gl, "vertex-shader", "fragment-shader" );

    cube = new Cube(gl);

    var modelT = new PV(-0.5, -0.5, -0.5, false);
    model2object = Mat.translation(modelT);
    object2model = Mat.translation(modelT.minus());

    object2rotated = new Mat();
    rotated2object = new Mat();

    var translation = new PV(0, 0, 0, false);
    rotated2world = Mat.translation(translation);
    world2rotated = Mat.translation(translation.minus());

    world2view = Mat.translation(new PV(0,0,-camera_dist, true));
    view2world = Mat.translation(new PV(0,0, camera_dist, true));

    view2proj = Mat.scale(new PV(1, 1, -1, false));
    proj2view = view2proj;


    aspect = canvas.width / canvas.height;
    proj2clip = new Mat(); 
    clip2proj = new Mat();
    
    clip2canvas =
        Mat.scale(new PV(canvas.width / 2.0, -canvas.height / 2.0, 1, true))
        .times(Mat.translation(new PV(1, -1, 0, false)));
    canvas2clip =
        Mat.translation(new PV(-1, 1, 0, false))
        .times(Mat.scale(new PV(2.0 / canvas.width, -2.0 / canvas.height, 1, true)));

    setPerspective();

    document.getElementById("zoomslider").value = zoom;
    document.getElementById("zoomslider").oninput = function(event) {
        zoom = parseFloat(event.target.value);
        setPerspective();
        render();
    };

    document.getElementById("alphaslider").value = alphaCorrection;
    document.getElementById("alphaslider").oninput = function(event) {
        console.log("alphaCorrection: " + event.target.value);
        alphaCorrection = parseFloat(event.target.value);
        render();
    };

    document.getElementById("stepslider").value = steps;
    document.getElementById("stepslider").oninput = function(event) {
        console.log("steps: " + event.target.value);
        steps = parseInt(event.target.value);
        render();
    };

    document.getElementById("teapot").onclick = function () {
        voxel_index = 0;
        updateVoxelTexture();
        render();
    };

    document.getElementById("bonsai").onclick = function () {
        voxel_index = 1;
        updateVoxelTexture();
        render();
    };

    document.getElementById("foot").onclick = function () {
        voxel_index = 2;
        updateVoxelTexture();
        render();
    };

    mouseIsDown = false;
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);
    document.body.addEventListener("mouseup", mouseUp); //catch mouseup events outside the canvas

    model2world = rotated2world.times(object2rotated.times(model2object));

    depthTextureExt = gl.getExtension("WEBGL_depth_texture"); 
    if(!depthTextureExt) { 
      alert("WEBGL_depth_texture not supported\nTry a newer browser"); 
      return; 
    }

    loadVoxelTexture();
    initTextureBuffers();
    render();
};

function initTextureBuffers() {
    //frame buffer (color)
    fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    fb.width = 512;
    fb.height = 512;

    //texture 
    fb_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fb_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    //depth buffer
    var renderbuffer = gl.createRenderbuffer(); 
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fb.width, fb.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    //tidy up
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function loadVoxelTexture() {
    var i;
    for (i=0; i<voxel_sources.length; i++) {
        voxel_ims[i] = new Image();
        voxel_ims[i].src = voxel_sources[i];
    }

    voxel_ims[voxel_index].onload = function() {
        console.log("voxel_im loading...");
        voxel_tex = Texture2D.create(gl, Texture2D.Filtering.BILINEAR,Texture2D.Wrap.MIRRORED_REPEAT, 
                                   voxel_ims[voxel_index].width, voxel_ims[voxel_index].height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, voxel_ims[voxel_index]);
        console.log("voxel_im loaded");
    };
}

function updateVoxelTexture() {
    console.log("voxel_im loading...");
    voxel_tex = Texture2D.create(gl, Texture2D.Filtering.BILINEAR,Texture2D.Wrap.MIRRORED_REPEAT, 
                                voxel_ims[voxel_index].width, voxel_ims[voxel_index].height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, voxel_ims[voxel_index]);
    console.log("voxel_im loaded");
}

function getArcBallVector(x, y) { //defines the sphere in view space, returns vectors in world space
  var fCanvas = new PV(x, y, -1, true);
  var bCanvas = new PV(x, y, 1, true);
  var f = view2world.times(proj2view.times(clip2proj.times(canvas2clip.times(fCanvas)))).homogeneous();
  var b = view2world.times(proj2view.times(clip2proj.times(canvas2clip.times(bCanvas)))).homogeneous();

  var center = new PV(0,0,0,true);
  var front = view2world.times(new PV(0,0,-near,true));
  var r = front.minus(center).magnitude();

  //find where fb intersects the imaginary sphere
  var q=f;
  var v=b.minus(f);
  //ray: q+s*v for any s in [0,1]
  var A = v.dot(v);
  var B = 2*q.minus(center).dot(v);
  var C = q.minus(center).dot(q.minus(center)) - r^2;
  // use quadratic formula
  var inner = B*B - 4*A*C;
  if (inner > 0) {
    var s = (-B - Math.sqrt(inner))/2/A;
    return q.plus(v.times(s)).minus(center);
  }

  return null; //cursor lies outside of sphere so we don't scroll
}

function mouseDown (e) {
  mouseIsDown = true;
  lastx = e.clientX - canvas.offsetLeft;
  lasty = e.clientY - canvas.offsetTop;
}

function mouseUp (e) {
  mouseIsDown = false;
}

function mouseMove (e) {
  if (!mouseIsDown)
      return;
  var currx = e.clientX - canvas.offsetLeft;
  var curry = e.clientY - canvas.offsetTop;
  if (lastx == currx && lasty == curry)
    return;

  v = getArcBallVector(lastx, lasty);
  w = getArcBallVector(currx, curry);

  if (v == null || w == null)
      return;

  v.unitize();
  w.unitize();

  //find transformation from v to w
  var vx = v.unit();
  var vz = v.cross(w).unit();
  var vy = vz.cross(vx);
  var wx = w.unit();
  var wz = vz;
  var wy = wz.cross(wx);
  var vMat = new Mat(vx, vy, vz);
  var wMat = new Mat(wx, wy, wz);
  var v2w = wMat.times(vMat.transpose());
  var w2v = vMat.times(wMat.transpose());

  world2view = world2view.times(v2w);
  view2world = w2v.times(view2world);

  updateM2C();

  lastx = currx;
  lasty = curry;
  render();
}

function render() {
    
    //-- RENDER TEXTURE --//
    gl.useProgram( texture_program );
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE  );
    if ( renderview == 1 || renderview == 2) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
    } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, fb.width, fb.height);   
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    if (renderview == 2)
        gl.cullFace(gl.BACK); //show the front face coordinates in render_view 2
    else
        gl.cullFace(gl.FRONT); //backface culling
    gl.enable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);
    
    var model2clipLoc = gl.getUniformLocation( texture_program, "model2clip" );
    var model2worldLoc = gl.getUniformLocation( texture_program, "model2world" );

    gl.uniformMatrix4fv(model2clipLoc, false, model2clip.flatten());
    gl.uniformMatrix4fv(model2worldLoc, false, model2world.flatten());

    cube.render(gl, texture_program);
    //-------------------//


    if (renderview == 3) {
        //--- RENDER VIEW ---//
        program = render_program;
        gl.useProgram( program );
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
        gl.enable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        

        gl.cullFace(gl.BACK);
        gl.disable(gl.CULL_FACE);

        gl.enable(gl.DEPTH_TEST);
        

        var model2clipLoc = gl.getUniformLocation( program, "model2clip" );
        var model2worldLoc = gl.getUniformLocation( program, "model2world" );
        var backTexLoc = gl.getUniformLocation(program, "backTex");
        var cubeTexLoc = gl.getUniformLocation(program, "cubeTex");
        var alphaCorrectionLoc = gl.getUniformLocation(program, "alphaCorrection");
        var stepsLoc = gl.getUniformLocation(program, "steps");

        gl.uniformMatrix4fv(model2clipLoc, false, model2clip.flatten());
        gl.uniformMatrix4fv(model2worldLoc, false, model2world.flatten());
        gl.uniform1f(alphaCorrectionLoc, alphaCorrection);
        gl.uniform1i(stepsLoc, steps);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fb_texture);
        gl.uniform1i(backTexLoc, 0);

        if (!voxel_tex) {
            requestAnimFrame( render )
            console.log("!voxel_tex");
            return;
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(cubeTexLoc, 1);
        voxel_tex.bind(gl);

        cube.render(gl, program);
        //---------------------//
    }

    // requestAnimFrame( render )
}
