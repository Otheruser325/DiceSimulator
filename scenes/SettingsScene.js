import { game, GameData, UIFactory } from '../main.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
        // Add switch sound for button clicks
        this.switchSound = this.sound.add('switchSound');

        // Title and content
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Settings");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2 - 60, "Settings: \n\nAudio & Background").setOrigin(0.5);

        // ----- SFX toggle button -----
        this.sfxToggle = UIFactory.createButton(
            this,
            `SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`,
            this.scale.width/2,
            this.scale.height/2 + 30,
            () => {
                GameData.sfxEnabled = !GameData.sfxEnabled;
                this.sfxToggle.setText(`SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`);
                if (GameData.sfxEnabled) this.switchSound.play();
            },
            "24px"
        );

        // ----- Background buttons -----
        game.bgManager.attach(this); // attaches scene and creates buttons
        game.bgManager.show();       // now buttons will actually display

        // ----- Back button -----
        this.backBtn = UIFactory.createButton(
            this,
            "Back",
            60,
            20,
            () => this.scene.start('MainMenuScene'),
            "30px",
            "#f00"
        ).setOrigin(0,0);

        // Track all UI elements for background color updates
        this.uiElements = [ this.title, this.content, this.sfxToggle, this.backBtn ];
    }

    // Called when leaving scene
    shutdown() {
        game.bgManager.hide();
    }
}