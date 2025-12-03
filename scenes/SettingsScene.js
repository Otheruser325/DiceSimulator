export default class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
        this.switchSound = this.sound.add('switchSound');

        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Settings");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2 - 60, "Settings: \n\nAudio & Background");

        // SFX toggle
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

        // Create background buttons dynamically
        const bgOptions = game.bgManager.getBackgroundOptions();
        this.bgButtons = [];
        const cols = 4;
        const startX = this.scale.width / 2 - 250;
        const startY = this.scale.height / 2 + 80;
        const spacingX = 150;
        const spacingY = 50;

        bgOptions.forEach((bg, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            const btn = UIFactory.createButton(
                this,
                bg.type,
                x,
                y,
                () => game.bgManager.select(index, this),
                "22px"
            );
            this.bgButtons.push(btn);
        });

        // Back button
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        // Track all UI for text recoloring
        this.uiElements = [ this.title, this.content, this.sfxToggle, this.backBtn, ...this.bgButtons ];

        // Apply current background
        game.bgManager.applyBackground(this);
    }

    shutdown() {
        // nothing to hide — buttons are scene-specific
    }
}