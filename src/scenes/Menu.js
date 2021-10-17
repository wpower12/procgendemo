import * as Phaser from 'phaser';

import GameEventManager from './GameEventManager.js';

export default class Menu extends Phaser.Scene {

	constructor(){ super('Menu'); }

	init(data){
		this.curr_pos      = data.pos;
		this.visited_cells = data.visited;
	}

	preload(){
	    this.load.atlasXML('interface', '/assets/uipack_rpg_sheet.png', 'assets/uipack_rpg_sheet.xml');
	    this.load.image('map_tile_grass', '/assets/map_tile_grass.png');
	    this.load.image('map_tile_empty', '/assets/map_tile_empty.png');
	    this.load.image('marker', '/assets/map_tile_marker.png');
	}	

	create(){
		this.bg = this.add.image(this.game.canvas.width/2, this.game.canvas.height/2, 'interface', 'panel_blue.png');
		this.bg.displayWidth  = 600;
		this.bg.displayHeight = 400;
		
		let cell_size   = {x: 20, y: 20};
		let sprite_size = {x: 16, y: 16};
		let margin      = {x: 30, y: 22};
		let offset = {x: margin.x+(cell_size.x/2)+(this.game.canvas.width-this.bg.displayWidth)/2,
					  y: margin.y+(cell_size.y/2)+(this.game.canvas.height-this.bg.displayHeight)/2};

		let num_i = (this.bg.displayWidth- 2*margin.x)/cell_size.x;
		let num_j = (this.bg.displayHeight-2*margin.y)/cell_size.y;

		for (var i = 0; i < num_i; i++) {
			for (var j = 0; j < num_j; j++) {
				let s = this.add.image(i*cell_size.x+offset.x, j*cell_size.y+offset.y, 'map_tile_empty');
				s.alpha = 0.5;
			}
		}

		for (var c = 0; c < this.visited_cells.length; c++) {
			let cell = this.visited_cells[c];
			let pos = {x: cell[0]*cell_size.x+offset.x,
					   y: cell[1]*cell_size.y+offset.y}
			let visited_tile = this.add.image(pos.x, pos.y, 'map_tile_grass');
			visited_tile.cellx = cell[0];
			visited_tile.celly = cell[1];
			visited_tile.setInteractive();
			visited_tile.on('pointerdown', function(pointer){
				GameEventManager.emit('teleport-to-cell', {x: this.cellx, y: this.celly});
			});
		}

		// position marker.
		let pos = {x: this.curr_pos.x*cell_size.x+offset.x,
		           y: this.curr_pos.y*cell_size.y+offset.y-0.5*cell_size.y,}
	    let marker = this.add.image(pos.x, pos.y, 'marker');
	    this.tweens.add({
	    	targets: marker,
            y: "+=4",
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        })

	    this.key_m = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
	    this.key_m.onDown = function() {
	    	this.scene.stop('Menu');
	    }.bind(this);
	}

}