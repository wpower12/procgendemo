import * as Phaser from 'phaser';

import GameEventManager from './GameEventManager.js';
import { TestLevel }    from '../LevelGenerator.js';

export default class Play extends Phaser.Scene {
	
	constructor() { super('Play'); }


	// "Abstract Method" Implementation

	preload() {
	    this.load.image('sky',       '/assets/sky.png');
	    this.load.image('grass',     '/assets/tile.png');
	    this.load.image('dirt',      '/assets/dirt.png');
	    this.load.image('stone',     '/assets/stone.png');
	    this.load.image('water',     '/assets/water.png');
	    this.load.image('towerbase', '/assets/towerbase.png');
	    this.load.image('towertop',  '/assets/towertop.png');

	    //Doodad Tiles.
	    this.load.image('wall_ud', '/assets/wall_updown.png');
	    this.load.image('wall_lr', '/assets/wall_leftright.png');
	    this.load.image('trees_1', '/assets/trees_1.png');
	    this.load.image('trees_2', '/assets/trees_2.png');
	    this.load.image('trees_3', '/assets/trees_6.png');
	    this.load.image('rocks_1', '/assets/rocks_4.png');
	    this.load.image('rocks_2', '/assets/rocks_5.png');          

	    this.load.atlasXML('alien', '/assets/alienBlue.png', 'assets/alienBlue.xml');
	    this.load.spritesheet('crystal-orange', '/assets/orange_crystal_anim.png', {frameWidth: 32, frameHeight: 32});
	    this.load.spritesheet('inputs', '/assets/inputs_packed.png', {frameWidth: 16, frameHeight: 16});
	}

	create() {
	    this.SIDE_LENGTH = 11;
	    this.MAX_H       = 3;
	    this.NOISE_SCALE = 20;
	    this.SEED        = "42";

	    this.isosize = {'depth': 38, 'width': 38, 'height': 8};
	    let { width, height } = this.sys.game.canvas;
	    this.y_os = -(this.SIDE_LENGTH)*this.isosize.width/2.75;

	    this.add.image(3*width/4, height/2, 'sky');
	    this.add.image(0,         height/2, 'sky');

	    // Control which cell in the 'world grid' we are in. 
	    this.cell_x = 13;
	    this.cell_y = 8;
	    this.visited_cells = [];
	    this.visited_cells.push([this.cell_x, this.cell_y]);

	    let cellOffset  = {x: this.cell_x*this.SIDE_LENGTH, y: this.cell_y*this.SIDE_LENGTH};
	   	this.level_grid = TestLevel(cellOffset, this.SIDE_LENGTH, this.MAX_H, this.NOISE_SCALE, this.SEED);

	    this.key_w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
	    this.key_s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
	    this.key_a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
	    this.key_d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
	    this.key_m = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

	    this.key_w.onDown = this.handleKeyDown('w')
	    this.key_a.onDown = this.handleKeyDown('a')
	    this.key_s.onDown = this.handleKeyDown('s')
	    this.key_d.onDown = this.handleKeyDown('d')
	    this.key_m.onDown = this.handleKeyDown('m');

	    let KEY_WIDTH = 16;
	    let KEY_SCALE = 5;
	    let PADDING   = 1;

	    this.main_scene = this.add.container();
	    this.inputContainer = this.add.container(KEY_WIDTH*3.5, KEY_WIDTH*(KEY_SCALE-1.5));

	    this.w_key_sprite = this.add.sprite(KEY_WIDTH*KEY_SCALE+PADDING    , 0                  , 'inputs', 86);
	    this.a_key_sprite = this.add.sprite(0                              , KEY_WIDTH*KEY_SCALE, 'inputs', 120);
	    this.s_key_sprite = this.add.sprite(KEY_WIDTH*KEY_SCALE+PADDING    , KEY_WIDTH*KEY_SCALE, 'inputs', 121);
	    this.d_key_sprite = this.add.sprite(2*(KEY_WIDTH*KEY_SCALE+PADDING), KEY_WIDTH*KEY_SCALE, 'inputs', 122);

	    this.w_key_sprite.setScale(KEY_SCALE).setInteractive().on('pointerdown', this.handleKeyDown('w'));
	    this.a_key_sprite.setScale(KEY_SCALE).setInteractive().on('pointerdown', this.handleKeyDown('a'));
	    this.s_key_sprite.setScale(KEY_SCALE).setInteractive().on('pointerdown', this.handleKeyDown('s'));
	    this.d_key_sprite.setScale(KEY_SCALE).setInteractive().on('pointerdown', this.handleKeyDown('d'));

	    this.inputContainer.add(this.w_key_sprite);
	    this.inputContainer.add(this.a_key_sprite);
	    this.inputContainer.add(this.s_key_sprite);
	    this.inputContainer.add(this.d_key_sprite);

	    // Initial Sprite Containers. 
	    this.waterContainer  = this.add.container(0, this.y_os);
	    this.levelContainer  = this.add.container(0, this.y_os);
	    this.portalContainer = this.add.container(0, this.y_os);
	    this.playerContainer = this.add.container(0, this.y_os);
	    this.waterSprites    = []; 
	    this.portalSprites   = [];

	    this.generateAnims();
	    this.generateLevelSprites();

	    // Controls where on this map the unit is.
	    this.player_x = Math.floor(this.SIDE_LENGTH/2);
	    this.player_y = Math.floor(this.SIDE_LENGTH/2);
	    this.player_h = this.level_grid[this.player_x][this.player_y]['height'];

	    // Initial Player Sprite.
	    this.player   = this.add.isoSprite(this.player_x*this.isosize.width-this.isosize.width/2,
	                                       this.player_y*this.isosize.depth-this.isosize.depth/2,
	                                       this.player_h*this.isosize.height-this.isosize.height/2,
	                                        'alien');
	    this.player.setScale(0.5);
	    this.playerContainer.add(this.player);
	    this.player.play('idle');

	    GameEventManager.on('teleport-to-cell', this.handleTeleport, this);
	}

	update(time, delta) {
		// no clue where I got this deep magic. I think from one of the iso examples?
	    // Makes the z level tween follow a trig surface. 
	    this.waterSprites.forEach(function (w) {
	        w.isoZ = (-2*Math.sin((this.time.now+(w.isoX*7))*0.004))+(-1*Math.sin((this.time.now+(w.isoY*8))*0.005));
	    }.bind(this));

	    this.portalSprites.forEach(function (w) {
	        w.isoZ = (-2*Math.sin((this.time.now+(w.isoX*7))*0.004))+(-1*Math.sin((this.time.now+(w.isoY*8))*0.005))+w.baseZ;
	    }.bind(this));

	    // Check if a portal is being stood on, and that no tweens are still running. 
	    if(this.level_grid[this.player_x][this.player_y]['portal'] && this.tweens.getTweensOf(this.player).length == 0){
	        this.playerFacing = this.level_grid[this.player_x][this.player_y]['facing'];
	        switch(this.playerFacing){
	            case 'w':
	                this.cell_y--;
	                break;
	            case 'a':
	                this.cell_x--;
	                break;
	            case 's':
	                this.cell_y++;
	                break;
	            case 'd':
	                this.cell_x++;
	                break;
	            default:
	                console.log(this.cell_x, this.cell_y)
	        }
	        
	        this.visited_cells.push([this.cell_x, this.cell_y]);
	        let cellOffset  = {x: this.cell_x*this.SIDE_LENGTH, y: this.cell_y*this.SIDE_LENGTH}
	        this.level_grid = TestLevel(cellOffset, this.SIDE_LENGTH, this.MAX_H, this.NOISE_SCALE, this.SEED);

	        this.resetLevelContainers();
	        this.generateLevelSprites();
	        this.resetPlayer();
	    }
	}

	// Helpers

	generateAnims = function(){
	    this.anims.create({
	        key: "spin-orange",
	        frameRate: 7,
	        frames: this.anims.generateFrameNumbers("crystal-orange", { start: 0, end: 7 }),
	        repeat: -1
	    });

	    this.anims.create({
	        key: "idle",
	        frameRate: 2,
	        frames: this.anims.generateFrameNames("alien", {prefix: 'alienBlue_', frames: ['stand', 'swim1'], suffix: '.png'}),
	        repeat: -1
	    });

	    this.anims.create({
	        key: "walk",
	        frameRate: 8,
	        frames: this.anims.generateFrameNames("alien", {prefix: 'alienBlue_walk', start: 0, end: 2, suffix: '.png'}),
	        repeat: -1
	    });
	}

	checkClearGrid = function(dx, dy){
        let nx = this.player_x+dx;
        let ny = this.player_y+dy;
        if(nx < 0 || ny < 0 || nx >= this.SIDE_LENGTH || ny >= this.SIDE_LENGTH){
            return false;
        }

        let ncell = this.level_grid[nx][ny]
        if(ncell['height'] == 0 || ncell['top'] != ''){
            return false;
        }

        return true;
    }

    handleKeyDown = function(facing){
        switch(facing){
            case 'w':
                return function(){
                    // NE
                    if(this.player_y > 0 
                        && this.checkClearGrid(0, -1)
                        && this.tweens.getTweensOf(this.player).length == 0)
                    {
                        this.player_y--;
                        this.player.flipX = false;
                        this.updatePlayerSprite()
                    }
                }.bind(this);
            case 'a':
                return function(){
                    // NW
                    if(this.player_x > 0 
                        && this.tweens.getTweensOf(this.player).length == 0
                        && this.checkClearGrid(-1, 0)){
                        this.player_x--;
                        this.player.flipX = true;
                        this.updatePlayerSprite()
                    }
                }.bind(this);
            case 's':
                return function(){
                    // SW
                    if(this.player_y < this.SIDE_LENGTH-1 
                        && this.tweens.getTweensOf(this.player).length == 0
                        && this.checkClearGrid(0, 1)){
                        this.player_y++;
                        this.player.flipX = true;
                        this.updatePlayerSprite()
                    }
                }.bind(this);
            case 'd':
                return function(){
                    // SE
                    if(this.player_x < this.SIDE_LENGTH-1 
                        && this.checkClearGrid(1, 0)
                        && this.tweens.getTweensOf(this.player).length == 0){
                        this.player_x++;
                        this.player.flipX = false;
                        this.updatePlayerSprite()
                    }
                }.bind(this);
            case 'm':
                return function(){
                    // SE
                    let cell_info = {pos: {x: this.cell_x, y: this.cell_y},
                					 visited: this.visited_cells};
                    this.scene.run('Menu', cell_info);
                }.bind(this);
                
        }
    }	

    handleTeleport = function(cell){
    	this.cell_x = cell.x;
    	this.cell_y = cell.y;
    	let cellOffset  = {x: this.cell_x*this.SIDE_LENGTH, y: this.cell_y*this.SIDE_LENGTH}
        this.level_grid = TestLevel(cellOffset, this.SIDE_LENGTH, this.MAX_H, this.NOISE_SCALE, this.SEED);
        this.resetLevelContainers();
        this.generateLevelSprites();

	    this.player_x = Math.floor(this.SIDE_LENGTH/2);
	    this.player_y = Math.floor(this.SIDE_LENGTH/2);
	    this.player_h = this.level_grid[this.player_x][this.player_y]['height'];
        
        this.player.isoX = this.player_x*this.isosize.width-this.isosize.width/2; 
        this.player.isoY = this.player_y*this.isosize.depth-this.isosize.depth/2;
        this.player.isoZ = this.player_h*this.isosize.height-this.isosize.height/2;
        // this.resetPlayer();

        this.scene.stop('Menu');
    }

    generateLevelSprites = function() {
        for (var i = 0; i < this.level_grid.length; i++) {
            for (var j = 0; j < this.level_grid[0].length; j++) {
                let cell = this.level_grid[i][j];

                if(cell['height'] == 0){
                    let new_water = this.add.isoSprite(i*this.isosize.width, 
                                                       j*this.isosize.depth, 
                                                       0, 
                                                       'water');
                    this.waterContainer.add(new_water);
                    this.waterSprites.push(new_water);
                } else {
                    for (var h = 0; h < cell['height']; h++) {
                        let new_sprite = this.add.isoSprite(i*this.isosize.width, 
                                                            j*this.isosize.depth, 
                                                            h*this.isosize.height, 
                                                            cell['tile']);
                        this.levelContainer.add(new_sprite);
                    }

                    if(cell['top'] != '' && !cell['portal']){
                        let dd_sprite = this.add.isoSprite(i*this.isosize.width, 
                                                           j*this.isosize.width, 
                                                           (cell['height'])*this.isosize.height,
                                                           cell['top'])
                        this.levelContainer.add(dd_sprite);
                    }

                    if (cell['portal']) {
                        let portalSprite = this.add.isoSprite(i*this.isosize.width, 
                                                           j*this.isosize.width, 
                                                           (cell['height'])*this.isosize.height,
                                                           cell['crystal'])
                        portalSprite.baseZ = (cell['height']+0.75)*this.isosize.height;
                        this.levelContainer.add(portalSprite);
                        this.portalSprites.push(portalSprite);
                        portalSprite.play(cell['anim']);
                    }
                }
            }
        }
    }

    resetLevelContainers = function() {
        this.waterContainer.destroy();  
        this.levelContainer.destroy(); 
        this.waterContainer  = this.add.container(0, this.y_os);
        this.levelContainer  = this.add.container(0, this.y_os);
        this.waterSprites    = []; 
        this.portalSprites   = [];

        this.main_scene.add(this.waterContainer);
        this.main_scene.add(this.levelContainer);
    }

    resetPlayer = function(){
        let flipped = false;
        switch(this.playerFacing){
            case 'w':
                this.player_y = this.SIDE_LENGTH-2;
                flipped = false;
                break;
            case 'a':
                this.player_x = this.SIDE_LENGTH-2;
                flipped = true;
                break;
            case 's':
                this.player_y = 1;
                flipped = true;
                break;
            case 'd':
                this.player_x = 1;
                flipped = false;
                break;
        }

        this.player.flipX = flipped;
        this.player_h = this.level_grid[this.player_x][this.player_y]['height'];
        
        this.player.isoX = this.player_x*this.isosize.width-this.isosize.width/2; 
        this.player.isoY = this.player_y*this.isosize.depth-this.isosize.depth/2;
        this.player.isoZ = this.player_h*this.isosize.height-this.isosize.height/2;
        this.scene.bringToTop(this.playerContainer);
        this.player.play('idle');
    }

    updatePlayerSprite = function(){
        this.player_h = this.level_grid[this.player_x][this.player_y]['height'];

        let new_isoX = this.player_x*this.isosize.width-this.isosize.width/2;
        let new_isoY = this.player_y*this.isosize.depth-this.isosize.depth/2;
        let new_isoZ = this.player_h*this.isosize.height-this.isosize.height/2;

        // Remove any other tweens.
        this.tweens.getTweensOf(this.player).forEach(t => t.remove());

        let moveTween = this.tweens.add({
            targets: this.player,
            duration: 500, 
            isoX: new_isoX, 
            isoY: new_isoY, 
            isoZ: new_isoZ, 
            ease: 'Power1',
            onStart: function () {this.player.play('walk')},
            onStartScope: this,
            onComplete: function () {this.player.play('idle')},
            onCompleteScope: this,
        });
    }
}