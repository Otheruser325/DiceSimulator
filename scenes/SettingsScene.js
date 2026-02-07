import { UIFactory } from '../utils/UIManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
        this.switchSound = this.sound.add('switchSound');

        const settings = SettingsManager.get(this);

        this.title = UIFactory.createTitle(this, this.scale.width/2, 100, "Settings");
        this.audioLabel = UIFactory.createText(this, this.scale.width/2, 220, "Audio");

        // SFX toggle
        this.sfxToggle = UIFactory.createButton(
            this,
            `SFX: ${settings.audio ? 'On' : 'Off'}`,
            this.scale.width/2,
            280,
            () => {
                const enabled = SettingsManager.toggle(this, 'audio');
                this.sfxToggle.setText(`SFX: ${enabled ? 'On' : 'Off'}`);
                if (enabled) this.switchSound.play();
            },
            "24px"
        );

        this.backgroundLabel = UIFactory.createText(this, this.scale.width/2, 360, "Background");
        const currentName = this.getBackgroundName(settings.bgIndex);
        this.currentBackgroundLabel = UIFactory.createText(this, this.scale.width/2, 400, `Current: ${currentName}`, "22px");

        // Create background buttons dynamically
        const bgOptions = this.game.bgManager.getBackgroundOptions();
        this.bgButtons = [];
        const cols = 4;
        const startX = this.scale.width / 2 - 270;
        const startY = 460;
        const spacingX = 150;
        const spacingY = 50;
        const selectedIndex = settings.bgIndex ?? 0;

        bgOptions.forEach((bg, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            const bgColor = index === selectedIndex ? "#2d7a2d" : "#333";

            const btn = UIFactory.createButton(
                this,
                bg.type,
                x,
                y,
                () => {
                    this.game.bgManager.select(index, this);
                    this.bgButtons.forEach((b, i) => b.setStyle({ backgroundColor: i === index ? "#2d7a2d" : "#333" }));
                    this.currentBackgroundLabel.setText(`Current: ${this.getBackgroundName(index)}`);
                    if (SettingsManager.get(this).audio) this.switchSound.play();
                },
                "22px",
                bgColor
            );
            this.bgButtons.push(btn);
        });

        // Back button
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            this.scene.start('MainMenuScene');
        });

        // Track all UI for text recoloring
        this.uiElements = [ this.title, this.audioLabel, this.sfxToggle, this.backgroundLabel, this.currentBackgroundLabel, this.backBtn, ...this.bgButtons ];

        // Apply current background
        this.game.bgManager.applyBackground(this);
    }

    shutdown() {
        // nothing to hide — buttons are scene-specific
    }

    getBackgroundName(index) {
        const bgOptions = this.game.bgManager.getBackgroundOptions();
        return bgOptions[index]?.type ?? 'Default';
    }
}
