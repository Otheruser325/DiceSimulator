import { GameData, BackgroundManager } from '../main.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // ---- Title ----
        this.titleText = this.add.text(
            centerX,
            centerY - 200,
            "Dice Simulator",
            {
                fontFamily: "Verdana",
                fontSize: "64px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        // ---- Loading Text ----
        this.loadingText = this.add.text(
            centerX,
            centerY - 40,
            "Loading...",
            { fontFamily: "Verdana", fontSize: "32px", color: "#ffffff" }
        ).setOrigin(0.5);

        // ---- Loading Bar Container ----
        const barWidth = this.scale.width * 0.6;
        const barHeight = 28;

        this.progressBg = this.add.rectangle(
            centerX, centerY + 20,
            barWidth, barHeight,
            0x222222
        ).setOrigin(0.5);

        this.progressBar = this.add.rectangle(
            centerX - barWidth/2, centerY + 20,
            0, barHeight,
            0xffffff
        ).setOrigin(0, 0.5);

        // ---- Progress handler (Phaser event) ----
        this.load.on('progress', (value) => {
            this.progressBar.width = barWidth * value;
        });

        // ---- Load JSON configs ----
        this.load.json('dices', 'config/dices.json');
        this.load.json('customDices', 'config/customDices.json');
        this.load.json('backgrounds', 'config/backgrounds.json');

        // ---- Load Audio ----
        this.load.audio('diceSound', 'assets/sfx/dice.mp3');
        this.load.audio('switchSound', 'assets/sfx/button.mp3');

        // Load cache
        this.load.async = true;
        this.fakeDelay = new Promise(resolve => setTimeout(resolve, 3000));
    }

    async create() {
        // Ensure delay is complete
        await this.fakeDelay;

        // Populate global GameData
        GameData.diceArray = this.cache.json.get('dices') ?? [];
        GameData.customDiceArray = this.cache.json.get('customDices') ?? [];
        GameData.backgroundsArray = this.cache.json.get('backgrounds') ?? [];

        // Create BackgroundManager globally
        game.bgManager = new BackgroundManager(this, GameData.backgroundsArray);

        // Preload SFX
        this.sound.add('diceSound');
        this.sound.add('switchSound');

        // Fade out preload screen
        this.cameras.main.fadeOut(600, 0, 0, 0);

        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.scene.start('MainMenuScene');
        });
    }
}