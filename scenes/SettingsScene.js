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

        const rowCount = Math.ceil(bgOptions.length / cols) || 1;
        const lastY = startY + (rowCount - 1) * spacingY;
        const tutorialLabelY = Math.min(this.scale.height - 140, lastY + 70);
        const tutorialButtonY = tutorialLabelY + 40;

        this.tutorialLabel = UIFactory.createText(this, this.scale.width / 2, tutorialLabelY, "Tutorial", "22px");
        this.tutorialButton = UIFactory.createButton(
            this,
            "Restart Tutorial",
            this.scale.width / 2,
            tutorialButtonY,
            () => this.showRestartTutorialConfirm(),
            "22px",
            "#7a2d2d"
        );

        // Back button
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            if (this.confirmContainer) {
                this.closeConfirmDialog();
                return;
            }
            this.scene.start('MainMenuScene');
        });

        // Track all UI for text recoloring
        this.uiElements = [
            this.title,
            this.audioLabel,
            this.sfxToggle,
            this.backgroundLabel,
            this.currentBackgroundLabel,
            this.tutorialLabel,
            this.tutorialButton,
            this.backBtn,
            ...this.bgButtons
        ];

        // Apply current background
        this.game.bgManager.applyBackground(this);
    }

    shutdown() {
        // nothing to hide — buttons are scene-specific
    }

    showRestartTutorialConfirm() {
        if (this.confirmContainer) return;

        const cam = this.cameras.main;
        const cx = cam.centerX;
        const cy = cam.centerY;

        const blocker = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
            .setDepth(10000)
            .setInteractive({ swallowPointer: true });

        const panel = this.add.rectangle(cx, cy, 560, 220, 0x1e1e1e)
            .setStrokeStyle(3, 0xffcc66)
            .setDepth(10001);

        const title = this.add.text(cx, cy - 70, 'Restart Tutorial?', {
            fontFamily: 'Verdana',
            fontSize: '26px',
            color: '#ffcc66'
        }).setOrigin(0.5).setDepth(10001);

        const body = this.add.text(cx, cy - 10, 'This will show the Dice Simulator tutorial\nnext time you open the simulator.', {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5).setDepth(10001);

        const yesBtn = UIFactory.createButton(this, 'Yes', cx - 90, cy + 70, () => {
            this.closeConfirmDialog();
            this.restartTutorialFlags();
        }, '22px', '#2d7a2d');

        const noBtn = UIFactory.createButton(this, 'No', cx + 90, cy + 70, () => this.closeConfirmDialog(), '22px', '#7a2d2d');

        yesBtn.setDepth(10001);
        noBtn.setDepth(10001);

        this.confirmContainer = this.add.container(0, 0, [blocker, panel, title, body, yesBtn, noBtn]);
        this.confirmContainer.setDepth(10000);
    }

    closeConfirmDialog() {
        if (this.confirmContainer) {
            this.confirmContainer.destroy(true);
            this.confirmContainer = null;
        }
    }

    restartTutorialFlags() {
        const settings = SettingsManager.get(this);
        const tutorials = { ...(settings.tutorials || {}) };
        tutorials.diceSimGuideV2 = false;
        SettingsManager.set(this, 'tutorials', tutorials);
    }

    getBackgroundName(index) {
        const bgOptions = this.game.bgManager.getBackgroundOptions();
        return bgOptions[index]?.type ?? 'Default';
    }
}
