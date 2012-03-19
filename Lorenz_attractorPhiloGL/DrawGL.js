/*
* Copyright (C) 2011 Samsung Electronics Corporation. All rights reserved.
* 
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided the following conditions
* are met:
* 
* 1.  Redistributions of source code must retain the above copyright
*     notice, this list of conditions and the following disclaimer.
* 
* 2.  Redistributions in binary form must reproduce the above copyright
*     notice, this list of conditions and the following disclaimer in the
*     documentation and/or other materials provided with the distribution.
* 
* THIS SOFTWARE IS PROVIDED BY SAMSUNG ELECTRONICS CORPORATION AND ITS
* CONTRIBUTORS "AS IS", AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING
* BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
* FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL SAMSUNG
* ELECTRONICS CORPORATION OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
* INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES(INCLUDING
* BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
* DATA, OR PROFITS, OR BUSINESS INTERRUPTION), HOWEVER CAUSED AND ON ANY THEORY
* OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT(INCLUDING
* NEGLIGENCE OR OTHERWISE ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
* EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var xCube=10;
var cubeVertices = [
    -xCube, -xCube, -xCube,   // 0
    -xCube,  xCube, -xCube,   // 1
     xCube,  xCube, -xCube,   // 2
     xCube, -xCube, -xCube,   // 3
    -xCube, -xCube,  xCube,   // 4 frontface
    -xCube,  xCube,  xCube,   // 5
     xCube,  xCube,  xCube,   // 6
     xCube, -xCube,  xCube,   // 7
];

var cubeIndices = [
     0, 1,              // backface
     1, 2,
     2, 3,
     3, 0,
     4, 5,              // frontface
     5, 6,
     6, 7,
     7, 4,
     0, 4,              // back to front
     1, 5,
     2, 6,
     3, 7,
];

function InitGL(canvasName) {
    var canvas = document.getElementById(canvasName);
    var gl = canvas.getContext("experimental-webgl");
    
    if(gl === null) {
        console.error("Failed to create WebGL context");
        return null;
    }
    
    // needed
    canvas.width  = WINW;
    canvas.height = WINH;

    // points
    //
    userData.pointProgram  = gl.createProgram();
    gl.attachShader(userData.pointProgram, getShader( gl, "point-vshader" ));
    gl.attachShader(userData.pointProgram, getShader( gl, "point-fshader" ));
    gl.linkProgram(userData.pointProgram);
    gl.useProgram(userData.pointProgram);

    userData.curPosLoc = gl.getAttribLocation(userData.pointProgram, "curPos");
    userData.mvpPointLoc = gl.getUniformLocation(userData.pointProgram, "mvp");
    


    userData.curPosVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.curPosVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.curPos, gl.DYNAMIC_DRAW);
    
    // cube
    //
    userData.cubeProgram  = gl.createProgram();
    gl.attachShader(userData.cubeProgram, getShader( gl, "cube-vshader" ));
    gl.attachShader(userData.cubeProgram, getShader( gl, "cube-fshader" ));
    gl.linkProgram(userData.cubeProgram);
    gl.useProgram(userData.cubeProgram);
    
    userData.cubeLoc = gl.getAttribLocation(userData.cubeProgram, "cube");
    userData.mvpCubeLoc = gl.getUniformLocation(userData.cubeProgram, "mvp");
    
    userData.cubeVertices = new Float32Array(cubeVertices);
    userData.cubeIndices  = new Uint16Array(cubeIndices);
    
    userData.cubeVertexVBO = gl.createBuffer();
    userData.cubeIndiceVBO = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeVertexVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.cubeVertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.cubeIndiceVBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, userData.cubeIndices, gl.STATIC_DRAW);
    
    // initialize matrices
    //
    userData.modelMatrix.makeIdentity();
        
    var aspect = WINW / WINH;
    userData.vpMatrix.perspective(45, aspect, 1, 10000);
    
    var cameraPosition = [0, 0, 20];
    var cameraTarget = [0, 0, 0];
    var cameraUpVector = [0, 1, 0];      
    userData.vpMatrix.lookat(
            cameraPosition[0], cameraPosition[1], cameraPosition[2],
            cameraTarget[0], cameraTarget[1], cameraTarget[2], 
            cameraUpVector[0], cameraUpVector[1], cameraUpVector[2]);
 
 

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    return gl;
}

function DrawGL(gl) {
    if(gl === null || !userData.isSimRunning)
        return;
    
    if(userData.is3D) {
    	userData.modelMatrix.rotate(userData.theta, 0, 1, 0);
    	userData.mvpMatrix.load(userData.vpMatrix);
    	userData.mvpMatrix.multiply(userData.modelMatrix);
    }
    else {
    	userData.mvpMatrix.makeIdentity();
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // cube
    //
    if(userData.is3D) {
		gl.useProgram(userData.cubeProgram);
		userData.mvpMatrix.setUniform(gl,userData.mvpCubeLoc, false);

		gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeVertexVBO);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.cubeIndiceVBO);
        
        gl.enableVertexAttribArray(userData.cubeLoc);
		gl.vertexAttribPointer(userData.cubeLoc, CUBE_ATTRIB_SIZE, gl.FLOAT, false, CUBE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0 );
		gl.drawElements(gl.LINES, userData.cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    }

   
    // particles
    //
    gl.useProgram(userData.pointProgram);
    userData.mvpMatrix.setUniform(gl,userData.mvpPointLoc, false);
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.curPosVBO);
    gl.enableVertexAttribArray(userData.curPosLoc);

    gl.vertexAttribPointer(userData.curPosLoc, POS_ATTRIB_SIZE, gl.FLOAT, false, POS_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.drawArrays(gl.POINTS, 0, NBODY);    
    gl.flush ();
}



function webGLStart() {
  var xRot = 0, xSpeed = 0,
      yRot = 0, ySpeed = 0,
      z = -5.0,
      filter = 0,
      filters = ['nearest', 'linear', 'mipmap'];

 var xCube=10;
  //Create object
  var cube = new PhiloGL.O3D.Model({

    vertices: [ -xCube, -xCube, -xCube,   // 0
                -xCube,  xCube, -xCube,   // 1
                xCube,  xCube, -xCube,   // 2
                xCube, -xCube, -xCube,   // 3
                -xCube, -xCube,  xCube,   // 4 frontface
                -xCube,  xCube,  xCube,   // 5
                xCube,  xCube,  xCube,   // 6
                xCube, -xCube,  xCube,   // 7
                    ],

    indices: [0, 1,              // backface
              1, 2,
              2, 3,
              3, 0,
              4, 5,              // frontface
              5, 6,
              6, 7,
              7, 4,
              0, 4,              // back to front
              1, 5,
              2, 6,
              3, 7]
  });

  PhiloGL('lesson06-canvas', {
    program: {
      from: 'ids',
      vs: 'cube-vshader',
      fs: 'cube-fshader'
    },
    events: {
      onKeyDown: function(e) {
        switch(e.key) {
          case 'f':
            filter = (filter + 1) % 3;
            break;
          case 'up':
            xSpeed -= 0.02;
            break;
          case 'down':
            xSpeed += 0.02;
            break;
          case 'left':
            ySpeed -= 0.02;
            break;
          case 'right':
            ySpeed += 0.02;
            break;
          //handle page up/down
          default:
            if (e.code == 33) {
              z -= 0.05;
            } else if (e.code == 34) {
              z += 0.05;
            }
        }
      }
    },
    onError: function() {
      alert("An error ocurred while loading the application");
    },
    onLoad: function(app) {
      var gl = app.gl,
          canvas = app.canvas,
          program = app.program,
          camera = app.camera,
          view = new PhiloGL.Mat4,
          rCube = 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      camera.view.id();

      //set buffers with cube data
      program.setBuffers({
        'aVertexPosition': {
          value: cube.vertices,
          size: 3
        },
        'indices': {
          value: cube.indices,
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          size: 1
        }
      });
      
       
        
        function animate() {
          xRot += xSpeed;
          yRot += ySpeed;
        }

        function tick() {
          drawScene();
          animate();
          PhiloGL.Fx.requestAnimationFrame(tick);
        }

        function drawScene() {




          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          //draw Cube
          cube.position.set(0, 0, z);
          cube.rotation.set(xRot, yRot, 0);
          //update element matrix
          cube.update();
          //get new view matrix out of element and camera matrices
          view.mulMat42(camera.view, cube.matrix);
          //set attributes, indices and textures
          program.setBuffer('aVertexPosition')
                .setBuffer('indices')
                .setTexture(filters[filter]);

          //set uniforms
          program.setUniform('uMVMatrix', view)
                .setUniform('uPMatrix', camera.projection)
                .setUniform('uSampler', 0);
          //draw triangles
          gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        tick();
      };
      //load image
      img.src = 'crate.gif';
    }  
  });
}


