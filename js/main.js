const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: [PreloadScene, MainMenuScene, DiceSimScene, CreateDiceScene, HelpScene, SettingsScene, ChangelogScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

// -----------------------
// Global shared data
// -----------------------
const GameData = {
    diceArray: [],
    customDiceArray: [],
    backgroundsArray: [],
    selectedDiceIndex: 0,
    selectedCustomDiceIndex: 0,
    sfxEnabled: true
};

// -----------------------
// UIFactory
// -----------------------
const UIFactory = {
    defaultFont: "Verdana",
    createButton(scene, text, x, y, callback, fontSize = "28px", bgColor = "#333", textColor = "#fff") {
        const button = scene.add.text(x, y, text, {
            fontFamily: this.defaultFont,
            fontSize,
            color: textColor,
            backgroundColor: bgColor,
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                scene.switchSound?.play();
                callback.call(scene);
            })
            .on("pointerover", () => button.setStyle({ backgroundColor: "#555" }))
            .on("pointerout", () => button.setStyle({ backgroundColor: bgColor }));

        return button;
    },

    createText(scene, x, y, content, fontSize = "24px", align = "center") {
        return scene.add.text(x, y, content, {
            fontFamily: this.defaultFont,
            fontSize,
            color: "#ffffff",
            align,
            wordWrap: { width: scene.scale.width * 0.8 }
        }).setOrigin(0.5);
    },

    createTitle(scene, x, y, content) {
        return scene.add.text(x, y, content, {
            fontFamily: this.defaultFont,
            fontSize: "72px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);
    }
};

// -----------------------
// InputFieldFactory: Phaser-native simple input (placeholder + keyboard capture)
// -----------------------
const InputFieldFactory = {
    create(scene, x, y, placeholder, style = {}) {
        const text = scene.add.text(x, y, placeholder, Object.assign({
            fontFamily: 'Verdana',
            fontSize: '28px',
            color: '#ccc',
            backgroundColor: '#222',
            padding: { x: 12, y: 8 }
        }, style)).setOrigin(0.5).setInteractive();

        text._placeholder = placeholder;
        text._realValue = "";
        text.inputing = false;

        // Focus
        text.on('pointerdown', () => {
            if (text.text === text._placeholder) text._realValue = "";
            text.inputing = true;
            text.setStyle({ color: '#ffffff' });
        });

        // Keyboard handling (scene-level listener for simplicity)
        // We'll register a single listener on the scene when this factory is used.
        text.getValue = () => text._realValue || "";

        // Blur detection via scene input down - handled externally by scene's pointerdown

        return text;
    }
};

// -----------------------
// BackgroundManager class
// -----------------------
class BackgroundManager {
    constructor(scene, backgroundsArray) {
        this.scene = scene;
        this.backgroundsArray = backgroundsArray || [];
        this.selected = parseInt(localStorage.getItem("bgIndex")) || 0;
        this.buttons = [];
        this.container = null;

        this.createMenu();
        this.applyBackground();
    }

    createMenu() {
        if (this.container) {
            this.container.destroy(true);
        }

        this.container = this.scene.add.container(0, 0);
        this.container.setVisible(false);
        this.buttons = [];

        const cols = 4;
        const startX = this.scene.scale.width / 2 - 250;
        const startY = this.scene.scale.height / 2 + 30;
        const spacingX = 150;
        const spacingY = 50;

        this.backgroundsArray.forEach((bg, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            const btn = UIFactory.createButton(this.scene, bg.type, x, y, () => this.select(index), "22px");
            this.buttons.push(btn);
            this.container.add(btn);
        });

        this.updateButtonStyles();
    }

    show() { if (this.container) this.container.setVisible(true); }
    hide() { if (this.container) this.container.setVisible(false); }

    select(index) {
        this.selected = index;
        localStorage.setItem("bgIndex", index);
        this.applyBackground();
        this.updateButtonStyles();
    }

    applyBackground() {
        const bg = this.backgroundsArray[this.selected] || { colorCode: "#000000" };
        const textColor = getOptimalTextColor(bg.colorCode);
        this.scene.cameras.main.setBackgroundColor(bg.colorCode);

        // recolor important UI items on the scene (scene must set .uiElements array)
        if (this.scene.uiElements && Array.isArray(this.scene.uiElements)) {
            this.scene.uiElements.forEach(el => {
                if (el?.setStyle) el.setStyle({ color: textColor });
            });
        }

        // Also update any global UI that may not be in scene.uiElements (best-effort)
        this.updateButtonStyles();
    }

    updateButtonStyles() {
        const activeColor = (this.backgroundsArray[this.selected] || {}).colorCode || "#000";
        const optimal = getOptimalTextColor(activeColor);

        this.buttons.forEach((btn, idx) => {
            if (idx === this.selected) {
                btn.setStyle({ backgroundColor: "#444", color: "#FFD700", fontWeight: "bold" });
            } else {
                btn.setStyle({ backgroundColor: "#222", color: optimal, fontWeight: "normal" });
            }
        });
    }
}

// -----------------------
// Color utilities (same luminance logic you used)
// -----------------------
function getLuminance(hex) {
    hex = (hex || '#000000').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function getOptimalTextColor(bgHex) {
    const lum = getLuminance(bgHex);
    if (lum > 0.7) return '#000000';
    if (lum > 0.5) return '#222222';
    return '#FFFFFF';
}

// -----------------------
// BootScene (preload + set GameData arrays)
// -----------------------
class PreloadScene extends Phaser.Scene {
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

// -----------------------
// MainMenuScene
// -----------------------
class MainMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMenuScene' }); }
    create() {
        // Keep references for background manager and sounds
        this.bgManager = game.bgManager;
        this.diceSound = this.sound.add('diceSound');
        this.switchSound = this.sound.add('switchSound');

        // Title
        this.titleText = UIFactory.createTitle(this, this.scale.width/2, this.scale.height/2 - 360, "Dice Simulator");

        // Buttons
        this.playButton = UIFactory.createButton(this, "Play", this.scale.width/2, this.scale.height/2 - 150, () => this.scene.start('DiceSimScene'));
        this.helpButton = UIFactory.createButton(this, "Help", this.scale.width/2, this.scale.height/2 - 50, () => this.scene.start('HelpScene'));
        this.settingsButton = UIFactory.createButton(this, "Settings", this.scale.width/2, this.scale.height/2 + 50, () => this.scene.start('SettingsScene'));
        this.changelogButton = UIFactory.createButton(this, "Changelog", this.scale.width/2, this.scale.height/2 + 150, () => this.scene.start('ChangelogScene'));

        // Group UI elements for text recolor by background manager
        this.uiElements = [ this.titleText, this.playButton, this.helpButton, this.settingsButton, this.changelogButton ];

        // Apply previously-chosen background immediately
        this.bgManager.scene = this; // temporarily point manager to this scene to recolor UI
        this.bgManager.applyBackground();
        this.bgManager.scene = game.scene.getScene('DiceSimScene') || this; // restore a sane scene pointer

        // Add little instructions to ensure BG buttons are hidden on main menu
        // BG menu remains hidden until settings scene opens
        this.bgManager.hide();
    }
}

// -----------------------
// DiceSimScene (main simulator)
// -----------------------
class DiceSimScene extends Phaser.Scene {
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

// -----------------------
// CreateDiceScene
// -----------------------
class CreateDiceScene extends Phaser.Scene {
    constructor() { super({ key: 'CreateDiceScene' }); }
    create() {
        this.bgManager = game.bgManager;
        this.bgManager.scene = this;

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

// -----------------------
// Help / Settings / Changelog scenes
// -----------------------
class HelpScene extends Phaser.Scene {
    constructor() { super({ key: 'HelpScene' }); }

    create() {
        this.bgManager = game.bgManager;

        this.title = UIFactory.createTitle(
            this,
            this.scale.width/2,
            120,
            "Help"
        );

        const helpText = `
Help Information:

Here you can learn how to use the dice simulation. Let’s explore!

PLAY:
By clicking on this button, you're able to experience the dice sandbox with features including:
- Roll Selected Dice
- Roll Random Dice
- Switch Dice Type
- Build-A-Dice
- Roll Custom Dice
- Roll Random Custom Dice
- Switch Custom Dice Type

Normal Dice:
Basic dice ranging from D6 to D100.

Custom Dice:
Invent your own dice from scratch! Use the "Build a Dice" tool to make the dice of your dreams. 
Try them using the custom dice options—essential for more complex games.

SETTINGS:
Turn SFX on/off or change the background.

CHANGELOG:
Shows updates to Dice Simulator.
        `;

        this.content = UIFactory.createText(
            this,
            this.scale.width/2,
            this.scale.height/2,
            helpText
        ).setOrigin(0.5);

        this.backBtn = UIFactory.createButton(
            this,
            "Back",
            60,
            20,
            () => this.scene.start('MainMenuScene'),
            "30px",
            "#f00"
        ).setOrigin(0,0);

        this.uiElements = [ this.title, this.content, this.backBtn ];

        this.bgManager.scene = this;
        this.bgManager.applyBackground();
    }
}

class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }
    create() {
        this.bgManager = game.bgManager;
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Settings");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2 - 60, "Settings: \n\nAudio & Background").setOrigin(0.5);

        // SFX toggle
        this.sfxToggle = UIFactory.createButton(this, `SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`, this.scale.width/2, this.scale.height/2 + 30, () => {
            GameData.sfxEnabled = !GameData.sfxEnabled;
            this.sfxToggle.setText(`SFX: ${GameData.sfxEnabled ? 'On' : 'Off'}`);
        }, "24px");

        // Show background buttons
        this.bgManager.show();

        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);

        this.uiElements = [ this.title, this.content, this.sfxToggle, this.backBtn ];
        this.bgManager.scene = this;
        this.bgManager.applyBackground();
    }

    shutdown() {
        // Hide background buttons when leaving settings
        this.bgManager.hide();
    }
}

class ChangelogScene extends Phaser.Scene {
    constructor() { super({ key: 'ChangelogScene' }); }
    create() {
        this.bgManager = game.bgManager;
        this.title = UIFactory.createTitle(this, this.scale.width/2, 120, "Changelog");
        this.content = UIFactory.createText(this, this.scale.width/2, this.scale.height/2, "v1.3 (01/12/2025)\n- Background settings update: You can now manually change the BG colour using the button grid\n- The background of your choice is now saved consistently upon refreshing Dice Simulator\n- The back button now returns to the roll simulation if you\'re in Build-A-Dice\nv1.2 (28/11/2025)\n- Added an option to change background colour\n- Added the ability to switch custom dice\n- Fixed an error related to rolling custom dice\n- Fixed the custom dice maker displaying the input boxes when backing out\n- Improved interface\nv1.1 (19/09/2024)\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs\nv1.0 (17/09/2024)\n- Dice Simulator Release").setOrigin(0.5);
        this.backBtn = UIFactory.createButton(this, "Back", 60, 20, () => this.scene.start('MainMenuScene'), "30px", "#f00").setOrigin(0,0);
        this.uiElements = [ this.title, this.content, this.backBtn ];
        this.bgManager.scene = this;
        this.bgManager.applyBackground();
    }
}

// -----------------------
// Helper functions
// -----------------------
function rollWithLuckFactor(sides, luckFactor) {
    let roll = Phaser.Math.Between(1, sides);
    if (luckFactor < 1) {
        roll = Math.floor(roll * luckFactor);
        roll = Phaser.Math.Clamp(roll, 1, sides);
    } else if (luckFactor > 1) {
        roll = Math.ceil(roll * luckFactor / (luckFactor + (sides - roll)));
        roll = Phaser.Math.Clamp(roll, 1, sides);
    }
    return roll;
}

function showAlert(message, type = 'error') {
    // Simple DOM alert overlay that auto-hides (keeps this lightweight)
    let el = document.getElementById('customAlert');
    if (!el) {
        el = document.createElement('div');
        el.id = 'customAlert';
        el.style.position = 'fixed';
        el.style.top = '10px';
        el.style.right = '10px';
        el.style.padding = '12px 16px';
        el.style.borderRadius = '6px';
        el.style.zIndex = '9999';
        el.style.fontFamily = 'Verdana';
        el.style.fontSize = '14px';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = '#fff';
    el.style.backgroundColor = type === 'success' ? '#28a745' : (type === 'warning' ? '#f39c12' : '#e74c3c');

    setTimeout(() => el.style.display = 'none', 3000);
}