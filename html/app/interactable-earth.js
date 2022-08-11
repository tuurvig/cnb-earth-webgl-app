define(['glMatrix', 'WebGLCore', 'earth', 'constants', 'Mouse'], function(glm, core, earth, c, mouse) {
  'use strict';

  const EPS = 0.000001;

  let Motion = function(start, end, frames){
    this.start = glm.vec2.clone(start);
    this.end = glm.vec2.clone(end);
    this.shift = glm.vec2.create();
    this.frames = frames;
    
    const gain = 1 / frames;
    glm.vec2.subtract(this.shift, end, start);
    glm.vec2.scale(this.shift, this.shift, gain);
  }

  let InteractableEarth = function(){
    core.app.call(this);
    this.projection = glm.mat4.create();
    this.model = null;
    this.pvm = glm.mat4.create();
    this.pvmInv = glm.mat4.create();
    this.textWorldCoords = glm.vec4.create();
    this.program = null;
    this.earth = null;
    this.activeGroup = null;
    this.textCanvas = null;
    this.textRenderer = null;
    this.offset = 0;
    this.activeLanguage = null;
    this.showNames = true;
    this.waitingFrames = 0;
    this.lastLocation = glm.vec2.create();
    this.currentLocation = glm.vec2.create();
    this.lastMotion = glm.vec2.create();
    this.motion = null;
    this.motionQueue = [];
  }
  
  InteractableEarth.prototype = Object.create(core.app.prototype);
  InteractableEarth.constructor = InteractableEarth;
  
  InteractableEarth.prototype.Setup = function(){
    this.ClearColor(0, 0, 0, 1);
  
    c.textureType.BORDER = 4;
    c.textureType.OVERLAY = 5;
  
    this.program = new earth.shader();
    this.program.Bind();
  
    this.earth = new earth.model([0.0, 0.0, -2.0]);
  
    this.ResizeUpdate();
    this.TextConfig();
  }

  InteractableEarth.prototype.SetupTextRenderer = function(canvas){
    this.textCanvas = canvas;
    this.textRenderer = this.textCanvas.getContext("2d");
    this.TextConfig();
    this.textRenderer.fillText("err", 0, 0);
  }

  InteractableEarth.prototype.SwitchToGroup = function(group){
    this.activeGroup = group;

    this.RotateToDefault();
  }
  
  InteractableEarth.prototype.RotateToDefault = function(){
    let angles = this.activeGroup.rotation || [0,0];
    const [angle1, angle2] = angles;
    this.earth.RotateTo(angle1, angle2);
  }

  InteractableEarth.prototype.GetOverlayTextureFromPath = function(path){
    return new core.texture2d(path, c.textureType.OVERLAY);
  }

  InteractableEarth.prototype.SwitchLanguage = function(lang){
    this.activeLanguage = lang;
  }

  InteractableEarth.prototype.ToggleNames = function(){
    return (this.showNames = !this.showNames);
  }
  
  InteractableEarth.prototype.Render = function(){
    this.Clear();
    this.textRenderer.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
  
    this.program.Bind();
    this.program.UploadMatrices(this.model, this.projection);
    
    this.activeGroup.texture.Bind();
    
    this.program.RenderElements(this.earth.GetCountOfIndices());
  
    if(this.showNames){
      this.RenderGroupTextOverlay(this.activeGroup);
    }
    
    // console.log("rendering");
  }
  
  InteractableEarth.prototype.RenderGroupTextOverlay = function(group){
    let members = group["members"];
    let self = this;
    members.forEach(member => {
      let country = self.earth.GetCountry(member);
      self.RenderText3D(country.coords, country.lang[self.activeLanguage]);
    })
  }
  
  InteractableEarth.prototype.RenderText2D = function(x, y, text){
    this.textRenderer.fillText(text, x, y);
  }
  
  InteractableEarth.prototype.RenderText3D = function(vector, text){
    let v = this.textWorldCoords;
    glm.vec4.transformMat4(v, vector, this.pvm);
  
    let wInv = 1 / v[3];
    let x = (v[0] * wInv * 0.5 + 0.5) * this.width;
    let y = (v[1] * wInv * -0.5 + 0.5) * this.height;
    let z = (v[2] * wInv * -0.5 + 0.5);
    
    if( z > 0.6 ){
      let alpha = 1.0;
      if( z < 0.85 ) alpha = (z - 0.6) * 4.0;
  
      this.textRenderer.globalAlpha = alpha;
      this.textRenderer.fillText(text, x, y);
    }
  }
  
  InteractableEarth.prototype.TimerUpdate = function(){
    //this.earth.Update(mouse.CurrentPos, mouse.IsLeftPressed(), window.innerWidth, window.innerWidth);
    
    if(mouse.IsLeftPressed()){
      if(glm.vec2.equals(this.lastLocation, mouse.CurrentPos)){
        this.waitingFrames = (this.waitingFrames + 1) % 20;
      }
      else{
        //console.log(this.waitingFrames);
        if(this.motionQueue.length === 0){
          this.motion = new Motion(this.lastLocation, mouse.CurrentPos, this.waitingFrames + 1);
        }
        else{
          this.motionQueue.push(new Motion(this.lastLocation, mouse.CurrentPos, this.waitingFrames + 1));
        }
        
        glm.vec2.copy(this.lastLocation, mouse.CurrentPos);
        this.waitingFrames = 0;
      }
    }

    if(this.motion){
      glm.vec2.add(this.currentLocation,this.motion.start, this.motion.shift);
      this.earth.AddRotation(this.motion.start, this.currentLocation, this.width, this.height);
      glm.vec2.copy(this.motion.start, this.currentLocation);
      this.motion.frames = this.motion.frames - 1;
      if(this.motion.frames === 0){
        this.earth.SetMotion(this.motion.end, this.motion.shift);
        this.motion = this.motionQueue.shift();
      }
    }
    else if(mouse.IsLeftPressed()){
    }
    else{
      this.earth.Spin(this.width, this.height);
    }

    this.model = this.earth.GetModelMatrix();
    glm.mat4.multiply(this.pvm, this.projection, this.model);
   
    // PRINTING SPHERE COORDINATES THAT ARE IN THE MIDDLE OF THE SCREEN
    //glm.mat4.invert(this._pvmInv, this._pvm);
    //if(Mouse.IsRightPressed()){
      //this.PrintLocationOnSphere();
    //}
  }
  
  InteractableEarth.prototype.unproject = function(out, x, y){
    x = (x / this.width) * 2.0 - 1.0;
    y = (y / this.height) * 2.0 - 1.0;
    let tmp = glm.vec4.fromValues(x, y, -1.0, 1.0);
  
    glm.vec4.transformMat4(out, tmp, this.pvmInv);
    glm.vec4.scale(out, out, 1 / out[3]);
  }
  
  InteractableEarth.prototype.PrintLocationOnSphere = function(){
    let textPos = glm.vec4.create();
    this.unproject(textPos, this.width*0.5, this.height*0.5);
    console.log(textPos);
  }
  
  InteractableEarth.prototype.ResizeUpdate = function(){
    glm.mat4.identity(this.projection)
    glm.mat4.perspective(this.projection, glm.glMatrix.toRadian(60), this.width / this.height, 1.0, 3.0);
  
    this.TextConfig();
  }
  
  InteractableEarth.prototype.TextConfig = function(){
    this.textRenderer.font = '16px NyohGeometricLight';
    this.textRenderer.textAlign = "center";
    this.textRenderer.textBaseline = "middle";
    this.textRenderer.fillStyle = "#ffffff";
  }
  
  InteractableEarth.prototype.MouseClick = function(){
    glm.vec2.copy(this.lastLocation, mouse.CurrentPos);
    //this.earth.SetClickAnchor(mouse.CurrentPos);
  }

  let interactable = {};

  interactable.app = InteractableEarth;
  interactable.UploadContext = core.UploadContext;

  return interactable;
  
});




/**/

