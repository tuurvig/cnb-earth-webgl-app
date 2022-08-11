define(['glMatrix'], function(glm) {
    'use strict';

    const Mouse = {
        ButtonMap: (new Array(3)).fill(false),
        CurrentPos: glm.vec2.create(),
        LastPos: glm.vec2.create(),
        Movement: glm.vec2.create(),
    
        SetButtonPressed: function(button){
            this.ButtonMap[button] = true;
        },
        SetButtonReleased: function(button){
            this.ButtonMap[button] = false;
        },
        IsLeftPressed: function(){
            return this.ButtonMap[0];
        },
        IsMiddlePressed: function(){
            return this.ButtonMap[1];
        },
        IsRightPressed: function(){
            return this.ButtonMap[2];
        },
    
        RegisterPosition: function(x, y){
            this.UpdateOriginPosition();
            glm.vec2.set(this.CurrentPos, x, y);
        },
        SetOriginPosition: function(x, y){
            glm.vec2.set(this.CurrentPos, x, y);
        },
        UpdateOriginPosition: function(){
            glm.vec2.copy(this.LastPos, this.CurrentPos);
        },
        // GetRelativeMovement: function(){
        //     glm.vec2.subtract(this.Movement, this.CurrentPos, this.LastPos);
        //     this.UpdateOriginPosition();
        //     return this.Movement;
        // }
    }
    
    return Mouse;
});



// 

