import { UIFactory } from '../utils/UIManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class HelpScene extends Phaser.Scene {
    constructor() { super({ key: 'HelpScene' }); }

    create() {
		this.switchSound = this.sound.add('switchSound');
        this.title = UIFactory.createTitle(
            this,
            this.scale.width/2,
            90,
            "Help"
        );
        this.title.setFontSize('56px');

        const helpText = `
Here you can learn how to use the dice simulation. Let's explore!

PLAY:
By clicking on this button, you're able to experience the dice sandbox with features including:
- Roll Selected Dice
- Roll Random Dice
- Switch Dice Type
- Multi-roll slider (roll 1-10 dice at once)
- Build-A-Dice
- Roll Custom Dice
- Roll Random Custom Dice
- Switch Custom Dice Type
- Probability Calculator (Normal/Custom)

Normal Dice:
Basic dice ranging from D6 to D100.

Custom Dice:
Invent your own dice from scratch! Use the "Build a Dice" tool to make the dice of your dreams.
Try them using the custom dice options--essential for more complex games.

Calculate:
Select a normal or custom die to view outcome probabilities and average roll.

SETTINGS:
Turn SFX on/off or change the background.

CHANGELOG:
Shows updates to Dice Simulator.
        `;

        this.content = UIFactory.createText(
            this,
            this.scale.width/2,
            this.scale.height/2 + 40,
            helpText,
            '20px'
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

        this.keybindsBtn = UIFactory.createButton(
            this,
            "Keybinds",
            this.scale.width - 60,
            20,
            () => this.scene.start('KeybindsScene'),
            "24px",
            "#1b6b1b"
        ).setOrigin(1,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            this.scene.start('MainMenuScene');
        });

        this.uiElements = [ this.title, this.content, this.backBtn, this.keybindsBtn ];
		
        this.game.bgManager.applyBackground(this);
    }
}
