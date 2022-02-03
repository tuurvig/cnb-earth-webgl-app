define(['glMatrix'], function(glm) {
    'use strict';

    const Trackball = {
        P1: glm.vec3.create(),
        P2: glm.vec3.create(),
        pointSub: glm.vec3.create(),
        rotAxis: glm.vec3.create(),
        rotInc: glm.mat4.create(), 
        SIZE: 1.225,
        GetNDCoords: function(out, screen, width, height){
            glm.vec2.set(out,
                -1.0 + 2.0*screen[0] / width,
                1.0 - 2.0*screen[1] / height
                );
        },
        SnapToSphere: function(out, radius, coords){
            let d, z, x = coords[0], y = coords[1];
            d = x*x + y*y;
            r2 = radius * radius;
            if( d < r2 ){
                z = Math.sqrt(r2 - d);
            }
            else z = 0;

            glm.vec3.set(out, x, y, z);
            glm.vec3.normalize(out, out);
            glm.vec3.scale(out, out, radius);
        },
        ProjectToSphere: function(out, radius, coords){
            let d, d2, z, x = coords[0], y = coords[1];
            //const SQRT2 = 1.41421356237309504880;
            const SQRT2INV = 0.70710678118654752440;
            
            d2 = x*x + y*y;
            d = Math.sqrt(d2);
            if( d < radius * SQRT2INV ){
                z = Math.sqrt(radius * radius - d2);
            }
            else {
                let t = radius * SQRT2INV;
                z = t*t / d;
            }

            glm.vec3.set(out, x, y, z);
            glm.vec3.normalize(out, out);
        },
        GetRotationAxisAndAngle: function(axis, start, end){
            this.ProjectToSphere(this.P1, this.SIZE, start);
            this.ProjectToSphere(this.P2, this.SIZE, end);

            glm.vec3.cross(axis, this.P1, this.P2);
            glm.vec3.normalize(axis, axis);
            glm.vec3.subtract(this.pointSub, this.P2, this.P1);

            let t = glm.vec3.length(this.pointSub) / (2.0 * this.SIZE);

            if(t > 1.0) t = 1.0;
            if(t < -1.0) t = -1.0;
            return 2.0 * Math.asin(t);
        },
        AddRotation: function(matrix, startP, endP, width, height){
            if((startP[0] === endP[0]) && (startP[1] === endP[1])) return;
            let start = glm.vec2.create(), end = glm.vec2.create();

            this.GetNDCoords(start, startP, width, height);
            this.GetNDCoords(end, endP, width, height);
            // console.log(start, end);
            this.ComputeRotation(this.rotInc, start, end);

            glm.mat4.multiply(matrix, this.rotInc, matrix);
        },
        ComputeRotation: function(out, start, end){
            glm.mat4.identity(out);
            if((start[0] === end[0]) && (start[1] === end[1])){    
                return;
            }
            else{
                let angle = this.GetRotationAxisAndAngle(this.rotAxis, start, end);

                glm.mat4.rotate(out, out, angle, this.rotAxis);
            }
        }
    }

    return Trackball;
});