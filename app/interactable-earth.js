define(['glMatrix', 'WebGLCore', 'earth', 'constants', 'Mouse'], function(glm, core, earth, c, mouse) {
  'use strict';

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
  }

  InteractableEarth.prototype.ResetUpdate = function(){
    this.UpdateCurrentTime();
    this.earth.ResetMotion();
  }

  InteractableEarth.prototype.SetupTextRenderer = function(canvas){
    this.textCanvas = canvas;
    this.textRenderer = this.textCanvas.getContext("2d");
  }

  InteractableEarth.prototype.SwitchToGroup = function(group){
    let angles = group.rotation || [0,0];
    const [angle1, angle2] = angles;
    this.earth.RotateTo(angle1, angle2);

    this.activeGroup = group;
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
    this.earth.Update(mouse.CurrentPos, mouse.IsLeftPressed(), this.width, this.height, this.timeDelta);
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
    this.textRenderer.font = '14px NyohGeometric';
    this.textRenderer.textAlign = "center";
    this.textRenderer.textBaseline = "middle";
    this.textRenderer.fillStyle = "#ffffff";
  }
  
  InteractableEarth.prototype.MouseClick = function(){
    this.earth.SetClickAnchor(mouse.CurrentPos);
  }

  let interactable = {};

  interactable.app = InteractableEarth;
  interactable.UploadContext = core.UploadContext;

  return interactable;
  
});




/**/

