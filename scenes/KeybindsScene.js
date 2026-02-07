import { UIFactory } from '../utils/UIManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class KeybindsScene extends Phaser.Scene {
    constructor() { super({ key: 'KeybindsScene' }); }

    create() {
        this.switchSound = this.sound.add('switchSound');

        this.title = UIFactory.createTitle(this, this.scale.width/2, 90, "Keybinds");
        this.title.setFontSize('56px');

        const text = `
Tabs:
- 1: Normal
- 2: Custom
- 3: Calculate (WIP)

Actions:
- R: Roll Random Dice
- S: Roll Selected Dice
- T: Switch Dice Type
- B: Build a Dice (Custom tab)
- Delete: Remove Selected Custom Dice

Navigation:
- ESC: Back / Close Modals
        `;

        const centerX = this.scale.width / 2;
        const viewTop = 170;
        const viewBottom = this.scale.height - 80;
        const viewHeight = viewBottom - viewTop;

        this.content = this.add.text(centerX, viewTop, text, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: this.scale.width * 0.8 }
        }).setOrigin(0.5, 0);

        const maskRect = this.add.rectangle(centerX, viewTop, this.scale.width * 0.85, viewHeight, 0x000000, 0)
            .setOrigin(0.5, 0);
        const mask = maskRect.createGeometryMask();
        this.content.setMask(mask);

        const scrollable = Math.max(0, this.content.height - viewHeight);
        const minY = viewTop - scrollable;
        const maxY = viewTop;

        this.input.on('wheel', (_pointer, _objects, _dx, dy) => {
            if (!scrollable) return;
            this.content.y = Phaser.Math.Clamp(this.content.y - dy * 0.5, minY, maxY);
        });

        this.backBtn = UIFactory.createButton(
            this,
            "Back",
            60,
            20,
            () => this.scene.start('HelpScene'),
            "30px",
            "#f00"
        ).setOrigin(0,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            this.scene.start('HelpScene');
        });

        this.uiElements = [ this.title, this.content, this.backBtn ];
        this.game.bgManager.applyBackground(this);
    }
}
