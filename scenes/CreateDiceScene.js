import { UIFactory } from '../utils/UIManager.js';
import { showAlert } from '../utils/AlertManager.js';
import { CustomDice, MAX_CUSTOM_DICE } from '../utils/DiceManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class CreateDiceScene extends Phaser.Scene {
    constructor() { super({ key: 'CreateDiceScene' }); }
    create() {
		this.switchSound = this.sound.add('switchSound');
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Create Custom Dice");

        // Input fields
        this.sidesInput = UIFactory.createInputField(
            this,
            this.scale.width / 2,
            this.scale.height / 2 - 20,
            "Enter sides...",
            {},
            { type: 'int', maxLength: 4 }
        );
        this.luckInput = UIFactory.createInputField(
            this,
            this.scale.width / 2,
            this.scale.height / 2 + 40,
            "Enter luck factor...",
            {},
            { type: 'float', maxLength: 6 }
        );
        UIFactory.bindInputFields(this, [this.sidesInput, this.luckInput], { allowTab: true, loop: false });

        // Create button
        this.createBtn = UIFactory.createButton(this, "Create Dice", this.scale.width/2, this.scale.height/2 + 120, this.submitCustomDice.bind(this), "26px");
        // Back button returns to DiceSimScene
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('DiceSimScene'), "30px", "#f00").setOrigin(0,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            this.scene.start('DiceSimScene');
        });

        // Group UI for bg recolor
        this.uiElements = [ this.title, this.sidesInput, this.luckInput, this.createBtn, this.backBtn ];
		
		// Apply current background
        this.game.bgManager.applyBackground(this);
    }

    submitCustomDice() {
        const sidesValue = Number(this.sidesInput.getValue());
        const luckValue = Number(this.luckInput.getValue());

        if (isNaN(sidesValue) || sidesValue < 6) {
            showAlert(this, 'Invalid side count (min 6)', 'error'); return;
        }
        if (isNaN(luckValue) || luckValue < 0) {
            showAlert(this, 'Invalid luck factor', 'error'); return;
        }

        const customDiceArray = this.registry.get('customDiceArray') ?? [];
        if (customDiceArray.length >= MAX_CUSTOM_DICE) {
            showAlert(this, `Custom dice limit reached (${MAX_CUSTOM_DICE}). Remove some to add more.`, 'warning');
            return;
        }
        customDiceArray.push({ type: `D${sidesValue}`, sides: sidesValue, luckFactor: luckValue });
        const saved = CustomDice.save(customDiceArray);
        this.registry.set('customDiceArray', saved);
        this.registry.set('selectedCustomDiceIndex', Math.max(0, saved.length - 1));
        this.registry.set('diceSimActiveTab', 'custom');
        this.registry.set('diceSimShowSuccess', true);
        this.scene.start('DiceSimScene');
    }
}
