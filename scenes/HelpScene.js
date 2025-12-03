import { game, UIFactory } from '../main.js';

export default class HelpScene extends Phaser.Scene {
    constructor() { super({ key: 'HelpScene' }); }

    create() {
		this.switchSound = this.sound.add('switchSound');
        this.title = UIFactory.createTitle(
            this,
            this.scale.width/2,
            120,
            "Help"
        );

        const helpText = `
Help Information:

Here you can learn how to use the dice simulation. Let’s explore!

PLAY:
By clicking on this button, you're able to experience the dice sandbox with features including:
- Roll Selected Dice
- Roll Random Dice
- Switch Dice Type
- Build-A-Dice
- Roll Custom Dice
- Roll Random Custom Dice
- Switch Custom Dice Type

Normal Dice:
Basic dice ranging from D6 to D100.

Custom Dice:
Invent your own dice from scratch! Use the "Build a Dice" tool to make the dice of your dreams. 
Try them using the custom dice options—essential for more complex games.

SETTINGS:
Turn SFX on/off or change the background.

CHANGELOG:
Shows updates to Dice Simulator.
        `;

        this.content = UIFactory.createText(
            this,
            this.scale.width/2,
            this.scale.height/2,
            helpText
        ).setOrigin(0.5);

        this.backBtn = UIFactory.createButton(
            this,
            "Back",
            60,
            20,
            () => this.scene.start('MainMenuScene'),
            "30px",
            "#f00"
        ).setOrigin(0,0);

        this.uiElements = [ this.title, this.content, this.backBtn ];
		
		game.bgManager.attach(this);
    }
	shutdown() {
        game.bgManager.hide();
    }
}