define(['WebGLCore', 'constants'], function(core, c) {
    'use strict';
    
    let Mesh = function(vertices, indices, count){
        this.vao = new core.buffer.vertexArray();
        this.count = count;
    
        this.vao.SetVertexBuffer(new core.buffer.vertex(vertices));
        this.vao.SetElementBuffer(new core.buffer.element(indices));
    
        this.vao.EnableVertexAttrib(c.location.POSITION);
        this.vao.SetVertexAttribPointer(c.location.POSITION, 3, 0, 8);
    
        this.vao.EnableVertexAttrib(c.location.NORMAL);
        this.vao.SetVertexAttribPointer(c.location.NORMAL, 3, 3, 8);
    
        this.vao.EnableVertexAttrib(c.location.TEX_COORD);
        this.vao.SetVertexAttribPointer(c.location.TEX_COORD, 2, 6, 8);
    }
    
    Mesh.prototype.GetCountOfIndices = function(){
        return this.count;
    }
    
    Mesh.prototype.Bind = function(){
        this.vao.Bind();
    }

    return Mesh;
});