import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import HelpScene from './scenes/HelpScene.js';
import KeybindsScene from './scenes/KeybindsScene.js';
import ChangelogScene from './scenes/ChangelogScene.js';
import DiceSimScene from './scenes/DiceSimScene.js';
import CreateDiceScene from './scenes/CreateDiceScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 960,
    parent: 'game-container',
    scene: [PreloadScene, MainMenuScene, SettingsScene, HelpScene, KeybindsScene, ChangelogScene, DiceSimScene, CreateDiceScene]
};

new Phaser.Game(config);
