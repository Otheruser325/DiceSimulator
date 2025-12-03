import { game, GameData, UIFactory } from '../main.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }
    create() {
		this.switchSound = this.sound.add('switchSound');
		
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Settings");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2 - 60, "Settings: \n\nAudio & Background").setOrigin(0.5);

        // SFX toggle
        this.sfxToggle = UIFactory.createButton(this, `SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`, this.scale.width/2, this.scale.height/2 + 30, () => {
            GameData.sfxEnabled = !GameData.sfxEnabled;
            this.sfxToggle.setText(`SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`);
        }, "24px");

        // Show background buttons
        game.bgManager.show();

        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        this.uiElements = [ this.title, this.content, this.sfxToggle, this.backBtn ];
		game.bgManager.attach(this);
    }
    shutdown() {
        // Hide background buttons when leaving settings
        game.bgManager.hide();
    }
}