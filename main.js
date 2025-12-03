import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import HelpScene from './scenes/HelpScene.js';
import ChangelogScene from './scenes/ChangelogScene.js';
import DiceSimScene from './scenes/DiceSimScene.js';
import CreateDiceScene from './scenes/CreateDiceScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 960,
    parent: 'game-container',
    scene: [PreloadScene, MainMenuScene, SettingsScene, HelpScene, ChangelogScene, DiceSimScene, CreateDiceScene]
};

export const game = new Phaser.Game(config);

// -----------------------
// Global shared data
// -----------------------
export const GameData = {
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
export const UIFactory = {
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
                if (GameData.sfxEnabled) scene.switchSound?.play();
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
export const InputFieldFactory = {
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
export class BackgroundManager {
    constructor(backgroundsArray) {
        this.backgroundsArray = backgroundsArray || [];
        this.selected = parseInt(localStorage.getItem("bgIndex")) || 0;
    }

    // Apply the background to a specific scene
    applyBackground(scene) {
        if (!scene) return;

        const bg = this.backgroundsArray[this.selected] || { colorCode: "#000000" };
        const textColor = getOptimalTextColor(bg.colorCode);

        scene.cameras.main.setBackgroundColor(bg.colorCode);

        if (scene.uiElements) {
            scene.uiElements.forEach(el => {
                if (el?.setStyle) el.setStyle({ color: textColor });
            });
        }
    }

    // Change the selected background and apply it to a scene
    select(index, scene) {
        this.selected = index;
        localStorage.setItem("bgIndex", index);
        this.applyBackground(scene);
    }

    // Return background options data
    getBackgroundOptions() {
        return this.backgroundsArray;
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
// Helper functions
// -----------------------
export function rollWithLuckFactor(sides, luckFactor) {
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

export function showAlert(message, type = 'error') {
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