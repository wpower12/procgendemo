import SimplexNoise from 'simplex-noise';
import * as sr from 'seedrandom';


export function TestLevel(cell_offset, side_length, max_height, scale, seed){
	let simplex = new SimplexNoise(seed);
	let prng    = sr.alea(""+cell_offset.x+" "+cell_offset.y) // Cheap 'hash' from cell offset to seed

	function getHeight(h, k){
		return Math.floor((max_height*(simplex.noise2D((h+cell_offset.x)/scale, (k+cell_offset.y)/scale)+1)))
	}

	var level = [];
	for (var i = 0; i < side_length; i++) {
		let new_row = [];
		for (var j = 0; j < side_length; j++) {
			// Find a doodad.
			// let t = Math.floor(13*(simplex.noise3D((i+cell_offset.x)*10, (j+cell_offset.y)*10, (i+cell_offset.x)*10)+1));
			let t = Math.floor(100*prng());
			let d; // doo-dad
            switch (t) {
                case 0:
                    d = 'trees_1';
                    break;
                case 1:
                    d = 'trees_2';
                    break;
                case 2:
                    d = 'trees_3';
                    break;
                case 4:
                    d = 'rocks_1';
                    break;
                case 5:
                    d = 'rocks_2';
                    break;
                default:
                    d = '';
			}

			let new_cell = {
				'height': getHeight(i, j),
				'tile': 'grass',
				'top': d,
				'portal': false
			};

			new_row.push(new_cell);
		}
		level.push(new_row);
	}

	let mid = Math.floor(side_length/2);

	function addPortal(x, y, f){
		if( level[x][y]['height'] > 0
			&& level[x][y]['top'] == ''){

			level[x][y]['tile']    = 'stone';
			level[x][y]['portal']  = true;
			level[x][y]['crystal'] = 'crystal-orange';
			level[x][y]['anim']    = 'spin-orange';
			level[x][y]['facing']  = f; // For 'cell to cell movement'
		}
	}

	addPortal(mid, 0, 'w');
	addPortal(0, mid, 'a');
	addPortal(mid, side_length-1, 's');
	addPortal(side_length-1, mid, 'd');


	let rare_spawn = Math.floor(prng()*100);

	switch(rare_spawn){
		case 1:
			// Tower?
			break
		default:
			// do nothing. 
			break
	}


	return level;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}