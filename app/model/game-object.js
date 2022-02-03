define(['Actor', 'Model', 'constants'], function(Actor, Model, c){
    let GameObject = function(position = c.ZERO_VECTOR, rotation = c.UNIT_MATRIX, model = new Model()){
        Actor.call(this, position, rotation);
        this.model = model;
    }
    
    GameObject.prototype = Object.create(Actor.prototype);
    GameObject.constructor = GameObject;

    return GameObject;
})