import { game, GameData, UIFactory, InputFieldFactory, showAlert } from '../main.js';

export default class CreateDiceScene extends Phaser.Scene {
    constructor() { super({ key: 'CreateDiceScene' }); }
    create() {
        this.bgManager = game.bgManager;
		this.bgManager.attach(this);

        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Create Custom Dice");

        // Input fields
        this.sidesInput = InputFieldFactory.create(this, this.scale.width/2, this.scale.height/2 - 20, "Enter sides...");
        this.luckInput = InputFieldFactory.create(this, this.scale.width/2, this.scale.height/2 + 40, "Enter luck factor...");

        // Keyboard handling: central listener to support both inputs
        this.input.keyboard.on('keydown', (event) => {
            // Backspace / Enter / character handling
            const active = [this.sidesInput, this.luckInput].find(f => f.inputing);
            if (!active) return;

            if (event.key === "Backspace") {
                active._realValue = active._realValue.slice(0, -1);
            } else if (event.key === "Enter") {
                active.inputing = false;
            } else {
                // Only numeric, allow dot for luck input
                if (active === this.sidesInput) {
                    if (/^[0-9]$/.test(event.key)) active._realValue += event.key;
                } else {
                    if (/^[0-9]$/.test(event.key)) active._realValue += event.key;
                    else if (event.key === "." && !active._realValue.includes(".")) active._realValue += ".";
                }
            }

            active.setText(active._realValue || active._placeholder);
        });

        // Blur detection: pointerdown on scene
        this.input.on('pointerdown', (pointer, gameObjects) => {
            // if click outside inputs -> blur both
            if (!gameObjects.includes(this.sidesInput) && !gameObjects.includes(this.luckInput)) {
                [this.sidesInput, this.luckInput].forEach(f => {
                    f.inputing = false;
                    if (!f._realValue) f.setText(f._placeholder);
                });
            }
        });

        // Create button
        this.createBtn = UIFactory.createButton(this, "Create Dice", this.scale.width/2, this.scale.height/2 + 120, this.submitCustomDice.bind(this), "26px");
        // Back button returns to DiceSimScene
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('DiceSimScene'), "30px", "#f00").setOrigin(0,0);

        // Group UI for bg recolor
        this.uiElements = [ this.title, this.sidesInput, this.luckInput, this.createBtn, this.backBtn ];

        // Apply background recolor
        this.bgManager.applyBackground();
    }

    submitCustomDice() {
        const sidesValue = Number(this.sidesInput.getValue());
        const luckValue = Number(this.luckInput.getValue());

        if (isNaN(sidesValue) || sidesValue < 6) {
            showAlert('Invalid side count (min 6)', 'error'); return;
        }
        if (isNaN(luckValue) || luckValue < 0) {
            showAlert('Invalid luck factor', 'error'); return;
        }

        GameData.customDiceArray.push({ type: `D${sidesValue}`, sides: sidesValue, luckFactor: luckValue });
        showAlert('Dice created successfully!', 'success');
        this.scene.start('DiceSimScene');
    }
}