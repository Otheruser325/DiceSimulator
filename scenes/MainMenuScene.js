import { game, UIFactory } from '../main.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMenuScene' }); }
    create() {
        this.diceSound = this.sound.add('diceSound');
        this.switchSound = this.sound.add('switchSound');

        // Title
        this.titleText = UIFactory.createTitle(this, this.scale.width/2, this.scale.height/2 - 360, "Dice Simulator");

        // Buttons
        this.playButton = UIFactory.createButton(this, "Play", this.scale.width/2, this.scale.height/2 - 150, () => this.scene.start('DiceSimScene'));
        this.helpButton = UIFactory.createButton(this, "Help", this.scale.width/2, this.scale.height/2 - 50, () => this.scene.start('HelpScene'));
        this.settingsButton = UIFactory.createButton(this, "Settings", this.scale.width/2, this.scale.height/2 + 50, () => this.scene.start('SettingsScene'));
        this.changelogButton = UIFactory.createButton(this, "Changelog", this.scale.width/2, this.scale.height/2 + 150, () => this.scene.start('ChangelogScene'));

        // Group UI elements for text recolor by background manager
        this.uiElements = [ this.titleText, this.playButton, this.helpButton, this.settingsButton, this.changelogButton ];
		
		// Apply current background
        game.bgManager.applyBackground(this);
    }
}