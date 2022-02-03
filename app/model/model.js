define(['Mesh'], function(Mesh) {
    'use strict';
    
    let Model = function(){
        this.meshes = [];
    }
    
    Model.prototype.AddMesh = function(mesh){
        this.meshes.push(mesh);
    }
    
    Model.prototype.AddMesh = function(vertices, indices, count){
        this.meshes.push(new Mesh(vertices, indices, count));
    }
    
    Model.prototype.GetMeshes = function(){
        return this.meshes;
    }
    
    return Model;
});
