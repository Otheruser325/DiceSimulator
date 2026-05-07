import { UIFactory } from '../utils/UIManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class ChangelogScene extends Phaser.Scene {
    constructor() { super({ key: 'ChangelogScene' }); }
    create() {
        this.switchSound = this.sound.add('switchSound');
        this.title = UIFactory.createTitle(this, this.scale.width/2, 90, "Changelog");
        this.title.setFontSize('56px');

        const contentText = "v1.6 (07/05/2026)\n- Added Dice Physics: watch dice roll, bounce, and settle in real-time\n- Calculator now accepts any sides and luck factor via input fields — no preset required\n- Calculator results are much clearer: shows a probability bar chart, exact average, and luck description\n- Fixed luck calculation: luck factor now uses a weighted distribution (e.g. luck 3 means max face is 3\u00d7 more likely than min face)\n- Dividing luck (e.g. 0.4) correctly weights lower faces more frequently\nv1.5 (18/02/2026)\n- Added a probability calculator with normal/custom dice selection and luck factor support\n- Multi-roll addition: roll up to 10 dice at once\n- Improved the tutorial for a more responsive feedback\n- Added an option to restart the tutorial in settings\n- Improved background and UI rendering\nv1.4 (07/02/2026)\n- New tabbed simulator UI (Normal, Custom, Calculate/WIP)\n- Custom dice are now saved to localStorage with a 100 dice cap; added an option to remove custom dice that you don't want to keep\n- Added current background indicator in the settings menu\n- Luck factor reworked for better high/low roll bias\n- Added keybinds and confirm-to-exit in simulator\n- UI layout improvements and button highlight states\nv1.3 (01/12/2025)\n- Background settings update: You can now manually change the BG colour using the button grid\n- The background of your choice is now saved consistently upon refreshing Dice Simulator\n- The back button now returns to the roll simulation if you\'re in Build-A-Dice\nv1.2 (28/11/2025)\n- Added an option to change background colour\n- Added the ability to switch custom dice\n- Fixed an error related to rolling custom dice\n- Fixed the custom dice maker displaying the input boxes when backing out\n- Improved interface\nv1.1 (19/09/2024)\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs\nv1.0 (17/09/2024)\n- Dice Simulator Release";

        const centerX = this.scale.width / 2;
        const viewTop = 170;
        const viewBottom = this.scale.height - 80;
        const viewHeight = viewBottom - viewTop;

        this.content = this.add.text(centerX, viewTop, contentText, {
            fontFamily: 'Verdana',
            fontSize: '20px',
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

        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        // ESC to back out
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            this.scene.start('MainMenuScene');
        });

        this.uiElements = [ this.title, this.content, this.backBtn ];
        this.game.bgManager.applyBackground(this);
    }
}
