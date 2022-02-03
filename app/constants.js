define(['glMatrix'], function(glm) {
    let constants = {};

    constants.WORLD_UP = glm.vec3.fromValues(0.0, 1.0, 0.0);
    constants.WORLD_RIGHT = glm.vec3.fromValues(1.0, 0.0, 0.0);
    constants.ZERO_VECTOR = glm.vec3.fromValues(0.0, 0.0, 0.0);
    constants.UNIT_MATRIX = glm.mat4.create();

    constants.location = {
        POSITION: 0,
        NORMAL: 1,
        TEX_COORD: 2,
        TANGENT: 3
    }

    constants.textureType = {
        DIFFUSE: 0,
        SPECULAR: 1,
        ROUGHNESS: 2,
        AMBIENT: 3
    }

    return constants;
});

