import * as Phaser from 'phaser';
import { IsometricPlugin } from '@koreez/phaser3-isometric-plugin';

import { TestLevel } from './LevelGenerator.js';

import Play from './scenes/Play.js';
import Menu from './scenes/Menu.js';

var config = {
    type: Phaser.WEBGL,
    width:  1000,
    height: 500,
    backgroundColor: '#2d2d2d',
    pixelArt: true,
    parent: document.getElementById('canvas-container'),
    plugins: {
        global: [
          { key: 'IsometricPlugin', plugin: IsometricPlugin, start: true },
        ],
    },
    scene: [Play, Menu]
};

var screen = window.screen;
screen.orientation.lock('landscape');
var game = new Phaser.Game(config);

