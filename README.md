# Volume Rendering
Render a 3D voxel grid by ray casting in WebGL

# Details
This is a WebGl implementation of a [ray casting algorithm](https://en.wikipedia.org/wiki/Volume_ray_casting). The scene is composed of a cube and the cube's front and back coordinates define the starting and ending points of each ray. To obtain the back coordinates, we perform a first render pass, using front face culling, saving the fragment's world space coordinates to a texture. The second render pass defines the rays (reading the back coordinates from the texture) and samples from the voxel grid to render the volume.

 ![https://imgbb.com/](https://i.ibb.co/KsDMBps/back.jpg) | ![https://imgbb.com/](https://i.ibb.co/fMJ9DhM/front.jpg) | ![https://imgbb.com/](https://i.ibb.co/4Fb4QXB/volume.jpg)
--- | --- | ---
back coordinates | front coordinates | volume

# Parameters
* **alphaCorrection**: the opacity of each voxel sample
* **steps**: number of voxel samples collected along each ray

# Demo
Try it out [here](https://chloearluck.github.io/volume-rendering/).