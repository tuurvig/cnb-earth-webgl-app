define([], function() {
    'use strict';
    
    let gl = null;

    ////////////////////////////////////////////////////////////////
    // WebGLApplication ////////////////////////////////////////////
    
    let WebGLApp = function(){
        this.width = 0;
        this.height = 0;
        this.timeDelta = 0;
        this.currentTimeMs = 0;
        this.currentTime = 0;
    }
    
    WebGLApp.prototype.PrintContext = function(){
        console.log(gl);
    }

    WebGLApp.prototype.Init = function(){
        gl.clearColor(0.5, 0.4, 0.8, 1.0);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        
        gl.enable(gl.DEPTH_TEST);
    }
    
    WebGLApp.prototype.ClearColor = function(r, g, b, a){
        gl.clearColor(r, g, b, a);
    }

    WebGLApp.prototype.SetWindow = function(width, height){
        this.width = width;
        this.height = height;
        gl.viewport(0, 0, this.width, this.height);
    }
    
    WebGLApp.prototype.ResizeUpdate = function(){
        return;
    }
    
    WebGLApp.prototype.Clear = function(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }
    
    WebGLApp.prototype.Render = function(){
        return;
    }
    
    WebGLApp.prototype.Setup = function(){
        return;
    }
    
    WebGLApp.prototype.UpdateCurrentTime = function(){
        this.currentTimeMs = performance.now();
        this.currentTime = this.currentTimeMs * 0.001;
    }
    
    WebGLApp.prototype.Timer = function(time){
        const tmp = time * 0.001;
        this.timeDelta = tmp - this._currentTime;
        this.currentTime = tmp;
        this.currentTimeMs = time;
    
        this.TimerUpdate();
    }
    
    WebGLApp.prototype.TimerUpdate = function(){
        return;
    }
    
    WebGLApp.prototype.MouseClick = function(){
        return;
    }

    ///////////////////////////////////////////////////////////////
    // Shader Program //////////////////////////////////////////////
    
    let ShaderProgram = function(vertexSrc, fragmentSrc){
        this.id = null;
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    
        let vs = this.vs, fs = this.fs;
    
        gl.shaderSource(vs, vertexSrc);
        gl.shaderSource(fs, fragmentSrc);
    
        gl.compileShader(vs);
        if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
            console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vs));
            return;
        }
    
        gl.compileShader(fs);
        if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
            console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fs));
            return;
        }
    
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
    
        gl.linkProgram(program);
        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            console.error('ERROR linking program!', gl.getProgramInfoLog(program));
            return;
        }
        
        gl.deleteShader(this._vs);
        gl.deleteShader(this._fs);
    
        gl.validateProgram(program);
        if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
            console.error('ERROR validating program!', gl.getProgramInfoLog(program));
            return;
        }
    
        this.id = program;
    }
    
    ShaderProgram.prototype.Bind = function(){
        gl.useProgram(this.id);
    }
    
    ShaderProgram.prototype.Unbind = function(){
        gl.useProgram(0);
    }
    
    ShaderProgram.prototype.Destroy = function(){
        gl.useProgram(0);
        gl.deleteProgram(this.id);
    }
    
    ShaderProgram.prototype.RenderElements = function(count){
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    }

    ShaderProgram.prototype.GetUniformLocation = function(name){
        return gl.getUniformLocation(this.id, name);
    }
    
    ShaderProgram.prototype.SetUniform1i = function(location, value){
        gl.uniform1i(location, value);
    }
    
    ShaderProgram.prototype.SetUniform1f = function(location, value){
        gl.uniform1f(location, value);
    }
    
    ShaderProgram.prototype.SetUniform2f = function(location, vector){
        gl.uniform2fv(location, vector);
    }
    
    ShaderProgram.prototype.SetUniform3f = function(location, vector){
        gl.uniform3fv(location, vector);
    }
    
    ShaderProgram.prototype.SetUniform4f = function(location, vector){
        gl.uniform4fv(location, vector);
    }
    
    ShaderProgram.prototype.SetUniformMat3 = function(location, matrix){
        gl.uniformMatrix3fv(location, false, matrix);
    }
    
    ShaderProgram.prototype.SetUniformMat4 = function(location, matrix){
        gl.uniformMatrix4fv(location, false, matrix);
    }
    //////////////////////////////////////////////////////////////////////
    //// Buffers ////////////////////////////////////////////////////////
    
    //// Vertex Buffer ////////////////////////
    
    let VertexBuffer = function(vertices){
        this.id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);   
    }
    
    VertexBuffer.prototype.Bind = function(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    }
    
    VertexBuffer.prototype.Unbind = function(){
        gl.bindBuffer(gl.ARRAY_BUFFER, 0);
    }
    
    VertexBuffer.prototype.Destroy = function(){
        gl.deleteBuffer(this.id);
    }
    
    //// Element Buffer ////////////////////////
    
    let ElementBuffer = function(indices){
        this.id = gl.createBuffer();
        this.vertexBuffer = null;
        this.elementBuffer = null;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    }
    
    ElementBuffer.prototype.Bind = function(){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
    }
    
    ElementBuffer.prototype.Unbind = function(){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, 0);
    }
    
    ElementBuffer.prototype.Destroy = function(){
        gl.deleteBuffer(this.id);
    }
    
    /////////////////////////////////////////////////////////////////////////
    ///// Vertex Array Object ///////////////////////////////////////////////
    
    let VertexArray = function(){
        this.id = gl.createVertexArray();
        gl.bindVertexArray(this.id);
    }
    
    VertexArray.prototype.Destroy = function(){
        gl.deleteVertexArray(this.id);
    }
    
    VertexArray.prototype.Bind = function(){
        gl.bindVertexArray(this.id);
    }
    
    VertexArray.prototype.Unbind = function(){
        gl.bindVertexArray(0);
    }
    
    VertexArray.prototype.SetVertexAttribPointer = 
    function(location, number, offset, stride, normalize = false){
        gl.vertexAttribPointer(location, number, gl.FLOAT, normalize, stride * Float32Array.BYTES_PER_ELEMENT, offset * Float32Array.BYTES_PER_ELEMENT);
    }
    
    VertexArray.prototype.EnableVertexAttrib = function(location){
        gl.enableVertexAttribArray(location);
    }
    
    VertexArray.prototype.SetVertexBuffer = function(vbo){
        this._vertexBuffer = vbo;
        this._vertexBuffer.Bind();
    }
    
    VertexArray.prototype.SetElementBuffer = function(ebo){
        this._elementBuffer = ebo;
        this._elementBuffer.Bind();
    }
    
    let Texture = function(file, type){
        this.id = gl.createTexture();
        this.type = type;
        this.file = file;
    }
    
    let Texture2D = function(file, type, typeStr){
        Texture.call(this, file, type);
        //gl.bindTexture(gl.TEXTURE_2D, this._id);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
        //    new Uint8Array([0, 0, 255, 255]));
        let texture = this;
        
        require(['image!' + file], function(image){
            texture.Bind();
    
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
        //image.src = file;
        
        // image.addEventListener('load', function(){
        //     texture.Bind();
    
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
        //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        //     gl.generateMipmap(gl.TEXTURE_2D);
        // });
    }
    
    Texture2D.prototype = Object.create(Texture.prototype);
    Texture2D.constructor = Texture2D;
    
    Texture2D.prototype.Bind = function(){
        gl.activeTexture(gl.TEXTURE0 + this.type);
        gl.bindTexture(gl.TEXTURE_2D, this.id);
    }

    let core = {
        gl: null,
        app: WebGLApp,
        shaderProgram: ShaderProgram,
        buffer: { vertex: VertexBuffer, element: ElementBuffer, vertexArray: VertexArray },
        texture2d: Texture2D,
        UploadContext: function(context){
            this.gl = context;
            gl = context;
        }
    }

    return core;
});


// 

