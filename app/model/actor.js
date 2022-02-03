define(['glMatrix', 'constants'], function(glm, c) {
    'use strict;'
    
    let Actor = function(position = c.ZERO_VECTOR, rotation = c.UNIT_MATRIX){
        this.position = glm.vec3.clone(position);
        this.rotationMatrix = glm.mat4.clone(rotation);
        this.modelMatrix = glm.mat4.create();
        glm.mat4.identity(this.modelMatrix);
    }

    Actor.prototype.GetModelMatrix = function(){
        glm.mat4.identity(this.modelMatrix);
        glm.mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        glm.mat4.multiply(this.modelMatrix, this.modelMatrix, this.rotationMatrix);
    
        return this.modelMatrix;
    }
    
    Actor.prototype.SetPosition = function(vector){
        glm.vec3.copy(this.position, vector);
    }
    
    Actor.prototype.ResetAllTransforms = function(){
        glm.mat4.identity(this.modelMatrix);
    }

    return Actor;
})

// 
