// current stess test yields 85000 particles before FPS dips below 18

var stage;
var canvas;
var grid;

// constants
var MOUSE_WIDTH = 20;
var MOUSE_HEIGHT = 10;
var STARTING_HEIGHT = 1;
var FALLING_SPEED = 1;
var PART_SIZE = 1;
var CREATION_SPEED = 10;


// mouse spout
var MOUSE_CREATION = true;
var MOUSE_WIDTH = 10;
var MOUSE_HEIGHT = 5;
var mousex;
var mousey;
var drop = true;
// screen spout
var SPOUT_CREATION = false;
var SPOUT_WIDTH = 60;
var more = true;

// lol these shouldnt be here
var particle_counter = 0;
var current_iter = 0;
var up_count = 0;
var mousex;
var mousey;

// pixel bitmap
var pixelSprite;

// Initialization functions
function init() {
    canvas = document.getElementById("game-canvas");
    stage = new createjs.SpriteStage(canvas);
    createjs.Touch.enable(stage);
    drop = false;
    if (MOUSE_CREATION) {
        stage.on("stagemousedown", start_dropping);
        stage.on("stagemouseup", stop_dropping);
        stage.on("stagemousemove", track_mouse);
    }
    grid = new Array(canvas.width * canvas.height);
    set_up_pixel("#000000");

    // create grid with boundaries
    var x;
    var y;
    for (x = 0; x < canvas.width; x++) {
        for (y = 0; y < canvas.height; y++) {
            if (x <= 5 || x >= canvas.width - 5 || y === 0 || y >= canvas.height - 5) {
                // add wall particles
                var wall = new Wall(x, y);
                stage.addChild(wall.shape);
            }
            else {
                grid[convert_xy_to_index(x, y)] = null;
            }        
        }
    }

    set_up_pixel("#CC9900");
    // set up mouse events
    createjs.Ticker.setFPS(24);
    createjs.Ticker.addEventListener("tick", game_update);
}

function set_up_pixel(color) {
    pixel_shape = new createjs.Shape();
    pixel_shape.graphics.beginFill(color).drawRect(0, 0, PART_SIZE, PART_SIZE);
    pixel_shape.x = 0;
    pixel_shape.y = 0;
    pixel_shape.bounds = new createjs.Rectangle(0, 0, PART_SIZE, PART_SIZE);
    var ssb = new createjs.SpriteSheetBuilder();
    var index = ssb.addFrame(pixel_shape);
    ssb.addAnimation("pixel",index);
    pixelSprite = new createjs.Sprite(ssb.build());
}

function new_particle_rand() {
    var x = canvas.width/2 + Math.floor((Math.random()*SPOUT_WIDTH)-SPOUT_WIDTH/2);
    var particle = new Particle(x, STARTING_HEIGHT);
    stage.addChild(particle.shape);
}

// mouse events
function start_dropping(event) {
    drop = true;
}

function stop_dropping(event) {
    drop = false;
}

function track_mouse(event) {
    mousex = Math.round(event.stageX);
    mousey = Math.round(event.stageY);
}

// Game loop
function game_update() {
    var cur_fps = createjs.Ticker.getMeasuredFPS();
    if (cur_fps < 18) {
        more = false;
        console.log("Slowdowns at " + particle_counter + " particles.");
    }

    up_count++; // randomness checker
    // spout creation
    if (SPOUT_CREATION) {
        if (more && current_iter === CREATION_SPEED) {
            for (i = 0; i < CREATION_SPEED; i++) {    
                new_particle_rand();
            }
        }
    }
    // mouse creation
    if (MOUSE_CREATION && drop) {
        var i;
        var k;
        for (i = 0; i < CREATION_SPEED; i++) {    
            var x = mousex + Math.floor((Math.random()*MOUSE_WIDTH)-MOUSE_WIDTH/2);
            var y = mousey + Math.floor((Math.random()*MOUSE_HEIGHT)-MOUSE_HEIGHT/2);
            var index = convert_xy_to_index(x, y);
            if (index < grid.length && index >= 0 && grid[index] === null) {
                var particle = new Particle(x, y);
                stage.addChild(particle.shape);
            }
        }
    }

    for (y = canvas.height - 1; y >= 0; y--) {
        if (up_count % 2 === 0) {
            for (x = 0; x < canvas.width; x++) {
                var ind = convert_xy_to_index(x,y);
                if (grid[ind] !== null) {
                    grid[ind].update();
                }       
            }
        }
        else {
            for (x = canvas.width - 1; x >= 0; x--) {
                var ind = convert_xy_to_index(x,y);
                if (grid[ind] !== null) {
                    grid[ind].update();
                }       
            }
        }
    }

    stage.update();
}

var Particle = function (x, y) {
    // make shape and coordinates
    this.shape = pixelSprite.clone();
    this.shape.x = x;
    this.shape.y = y;
    this.shape.gotoAndStop(0);
    // get index
    particle_counter++;
    grid[convert_xy_to_index(x, y)] = this;
}

Particle.prototype.update = function () {
    var left_open = false;
    var right_open = false;
    // if nothing immediately below, move down!
    if (grid[convert_xy_to_index(this.shape.x, this.shape.y + FALLING_SPEED)] === null) {
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = null;
        this.shape.y += FALLING_SPEED;
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = this;
        return;
    }
    // look to left and right
    if (grid[convert_xy_to_index(this.shape.x - 1, this.shape.y + FALLING_SPEED)] === null) {
        left_open = true;
    }
    if (grid[convert_xy_to_index(this.shape.x + 1, this.shape.y + FALLING_SPEED)] === null) {
        right_open = true;
    }
    // nothing on either side
    if (left_open && right_open) {
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = null;
        this.shape.y += FALLING_SPEED;
        // left
        if (up_count % 2 === 0) {
            this.shape.x += 1;
        }
        else {
            this.shape.x -= 1;
        }
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = this;
    }
    // empty left
    else if (left_open) {
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = null;

        this.shape.y += FALLING_SPEED;
        this.shape.x -= 1;

        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = this;
    }
    // empty right
    else if (right_open) {
        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = null;

        this.shape.y += FALLING_SPEED;
        this.shape.x += 1;

        grid[convert_xy_to_index(this.shape.x, this.shape.y)] = this;
    }
}

var Wall = function (x, y) {
    // make shape and coordinates
    this.shape = pixelSprite.clone();
    this.shape.x = x;
    this.shape.y = y;
    this.shape.gotoAndStop(0);
    particle_counter++;
    grid[convert_xy_to_index(x, y)] = this;
}

Wall.prototype.update = function () {
    //do nothing
    return;
}
// Utility functions
function convert_xy_to_index(x, y) {
    return x + (y * canvas.width); 
}


