import { game, GameData, UIFactory, rollWithLuckFactor, showAlert } from '../main.js';

export default class DiceSimScene extends Phaser.Scene {
    constructor() { super({ key: 'DiceSimScene' }); }
    create() {
        this.bgManager = game.bgManager;
        this.diceSound = this.sound.add('diceSound');
        this.switchSound = this.sound.add('switchSound');

        // Result text
        this.resultText = this.add.text(this.scale.width/2, this.scale.height/2 + 280, '', { fontSize: '24px', fontFamily: 'Verdana', color: '#fff' }).setOrigin(0.5).setVisible(false);

        // Buttons
        this.rollRandomButton = UIFactory.createButton(this, 'Roll Random Dice', this.scale.width/2, this.scale.height/2 - 260, this.rollRandomDice);
        this.rollSelectedButton = UIFactory.createButton(this, 'Roll Selected Dice', this.scale.width/2, this.scale.height/2 - 180, this.rollSelectedDice);
        this.switchDiceButton = UIFactory.createButton(this, 'Switch Dice Type', this.scale.width/2, this.scale.height/2 - 100, this.switchDiceType);
        this.createDiceButton = UIFactory.createButton(this, 'Build a Dice!', this.scale.width/2, this.scale.height/2 - 20, () => this.scene.start('CreateDiceScene'));
        this.rollCustomDiceButton = UIFactory.createButton(this, 'Roll Custom Dice', this.scale.width/2, this.scale.height/2 + 60, this.rollCustomDice);
        this.rollRandomCustomDiceButton = UIFactory.createButton(this, 'Roll Random Custom Dice', this.scale.width/2, this.scale.height/2 + 140, this.rollRandomCustomDice);
        this.switchCustomDiceButton = UIFactory.createButton(this, 'Switch Custom Dice Type', this.scale.width/2, this.scale.height/2 + 220, this.switchCustomDiceType);

        // Back button (returns to main menu)
        this.backButton = UIFactory.createButton(this, 'Back', 60, 20, () => this.scene.start('MainMenuScene'), '30px', '#f00').setOrigin(0,0);

        // SFX toggle will live in Settings scene; we'll show/hide result text on demand
        this.uiElements = [
            this.rollRandomButton, this.rollSelectedButton, this.switchDiceButton,
            this.createDiceButton, this.rollCustomDiceButton, this.rollRandomCustomDiceButton,
            this.switchCustomDiceButton, this.resultText, this.backButton
        ];

        // Hide certain UI by default if desired (we show everything on entering)
        this.showUI();

        // Apply background color and recolor UI
        this.bgManager.scene = this;
        this.bgManager.applyBackground();
    }

    showUI() {
        this.uiElements.forEach(el => el.setVisible(true));
    }
    hideUI() {
        this.uiElements.forEach(el => el.setVisible(false));
    }

    // ----- Simulator actions -----
    rollRandomDice() {
        const diceArray = GameData.diceArray;
        if (!diceArray || diceArray.length === 0) {
            showAlert('No dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('diceSound');
        const dice = diceArray[Phaser.Math.Between(0, diceArray.length - 1)];
        const result = Phaser.Math.Between(1, dice.sides);
        this.scene.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
    }

    rollSelectedDice() {
        const diceArray = GameData.diceArray;
        if (!diceArray || diceArray.length === 0) {
            showAlert('No dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('diceSound');
        const dice = diceArray[GameData.selectedDiceIndex || 0];
        const result = Phaser.Math.Between(1, dice.sides);
        this.scene.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
    }

    switchDiceType() {
        const diceArray = GameData.diceArray;
        if (!diceArray || diceArray.length === 0) {
            showAlert('No dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('switchSound');
        GameData.selectedDiceIndex = (GameData.selectedDiceIndex + 1) % diceArray.length;
        this.resultText.setText(`Selected ${diceArray[GameData.selectedDiceIndex].type}`).setVisible(true);
    }

    rollCustomDice() {
        const arr = GameData.customDiceArray;
        if (!arr || arr.length === 0) {
            showAlert('No custom dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('diceSound');
        const dice = arr[GameData.selectedCustomDiceIndex || 0];
        const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
        this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
    }

    rollRandomCustomDice() {
        const arr = GameData.customDiceArray;
        if (!arr || arr.length === 0) {
            showAlert('No custom dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('diceSound');
        const idx = Phaser.Math.Between(0, arr.length - 1);
        const dice = arr[idx];
        const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
        this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
    }

    switchCustomDiceType() {
        const arr = GameData.customDiceArray;
        if (!arr || arr.length === 0) {
            showAlert('No custom dice available!', 'warning');
            return;
        }
        if (GameData.sfxEnabled) this.scene.sound.play('switchSound');
        GameData.selectedCustomDiceIndex = (GameData.selectedCustomDiceIndex + 1) % arr.length;
        this.resultText.setText(`Selected ${arr[GameData.selectedCustomDiceIndex].type}`).setVisible(true);
    }
}