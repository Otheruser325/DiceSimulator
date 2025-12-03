import { game, UIFactory } from '../main.js';

export default class ChangelogScene extends Phaser.Scene {
    constructor() { super({ key: 'ChangelogScene' }); }
    create() {
        this.switchSound = this.sound.add('switchSound');
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Changelog");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2, "v1.3 (01/12/2025)\n- Background settings update: You can now manually change the BG colour using the button grid\n- The background of your choice is now saved consistently upon refreshing Dice Simulator\n- The back button now returns to the roll simulation if you\'re in Build-A-Dice\nv1.2 (28/11/2025)\n- Added an option to change background colour\n- Added the ability to switch custom dice\n- Fixed an error related to rolling custom dice\n- Fixed the custom dice maker displaying the input boxes when backing out\n- Improved interface\nv1.1 (19/09/2024)\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs\nv1.0 (17/09/2024)\n- Dice Simulator Release").setOrigin(0.5);
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);
        this.uiElements = [ this.title, this.content, this.backBtn ];
		game.bgManager.attach(this);
    }
	shutdown() {
        game.bgManager.hide();
    }
}