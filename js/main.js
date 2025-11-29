const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

let diceArray = [];
let customDiceArray = [];
let backgroundsArray = [];
let selectedDiceIndex = 0;
let selectedCustomDiceIndex = 0;
let selectedBackgroundIndex = 0;
let rollRandomButton, rollSelectedButton, switchDiceButton, createDiceButton, rollCustomDiceButton, rollRandomCustomDiceButton, switchCustomDiceButton;
let backButton;
let inputContainer;
let titleText, helpText, settingsText, changelogText;
let sfxToggleButton, backgroundToggleButton;
let sfxEnabled = true;

function preload() {
    this.load.json('dices', 'config/dices.json');
    this.load.json('customDices', 'config/customDices.json');
	this.load.json('backgrounds', 'config/backgrounds.json');
    this.load.audio('diceSound', 'assets/sfx/dice.mp3');
    this.load.audio('switchSound', 'assets/sfx/button.mp3');
}

function create() {
    diceArray = this.cache.json.get('dices');
    customDiceArray = this.cache.json.get('customDices');
	backgroundsArray = this.cache.json.get('backgrounds');

    this.diceSound = this.sound.add('diceSound');
    this.switchSound = this.sound.add('switchSound');

    // Create UI buttons
    this.playButton = createButton.call(this, 'Play', config.width / 2, config.height / 2 - 150, showSimulation);
    this.helpButton = createButton.call(this, 'Help', config.width / 2, config.height / 2 - 50, showHelp);
    this.settingsButton = createButton.call(this, 'Settings', config.width / 2, config.height / 2 + 50, showSettings);
    this.changelogButton = createButton.call(this, 'Changelog', config.width / 2, config.height / 2 + 150, showChangelog);

    backButton = createButton.call(this, 'Back', 60, 20, showMainMenu, '30px', '#f00').setVisible(false);

    rollRandomButton = createButton.call(this, 'Roll Random Dice', config.width / 2, config.height / 2 - 300, rollRandomDice).setVisible(false);
    rollSelectedButton = createButton.call(this, 'Roll Selected Dice', config.width / 2, config.height / 2 - 220, rollSelectedDice).setVisible(false);
    switchDiceButton = createButton.call(this, 'Switch Dice Type', config.width / 2, config.height / 2 - 140, switchDiceType).setVisible(false);
    createDiceButton = createButton.call(this, 'Build a Dice!', config.width / 2, config.height / 2 - 60, showCreateDiceMenu).setVisible(false);
    rollCustomDiceButton = createButton.call(this, 'Roll Custom Dice', config.width / 2, config.height / 2 + 20, rollCustomDice).setVisible(false);
    rollRandomCustomDiceButton = createButton.call(this, 'Roll Random Custom Dice', config.width / 2, config.height / 2 + 100, rollRandomCustomDice).setVisible(false);
	switchCustomDiceButton = createButton.call(this, 'Switch Custom Dice Type', config.width / 2, config.height / 2 + 180, switchCustomDiceType).setVisible(false);
	
	titleText = createText.call(this, config.width / 2, config.height / 90 - 360, 'Dice Simulator').setVisible(true);

    this.resultText = this.add.text(config.width / 2, config.height / 2 + 240, '', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setVisible(false);

    helpText = createText.call(this, config.width / 2, config.height / 2, 'Help Information: \n\n Here you can learn how to use the dice simulation. Let\'s explore! \n\n PLAY: By clicking on this button, you\'re able to experience the dice sandbox by using various features, which includes: \n - Roll Selected Dice \n - Roll Random Dice \n - Switch Dice Type \n - Build a Dice \n - Roll Custom Dice \n - Roll Random Custom Dice \n - Switch Custom Dice Type \n\n Normal Dice: Just basic dice ranging from D6 to D100. Accessible as a primary education tool, or as a time killer. \n Custom Dice: Invent your own dice from scratch! Use the "Build a Dice" tool to make the dice of your dreams! You can always try them out yourself \n by using the custom dice options; essential for more complex games. \n\n SETTINGS: If things aren\'t suitable, you can turn off the sound effects (SFX) or change the background to your favourite colour. It\'s up to you. \n\n CHANGELOG: Regular updates to the Dice Simulator.').setVisible(false);
    settingsText = createText.call(this, config.width / 2, config.height / 2, 'Settings Options: \n\n Customize your game settings here!').setVisible(false);
    changelogText = createText.call(this, config.width / 2, config.height / 2, 'Changelog: \nv1.2\n\n- Added an option to change background colour\n- Added the ability to switch custom dice\n- Fixed an error related to rolling custom dice\n- Fixed the custom dice maker displaying the input boxes when backing out\n- Improved interface\nv1.1\n\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs\nv1.0\n\n- Dice Simulator Release').setVisible(false);
	
	// Custom Dice UI
    this.sidesInput = createInputField(
        this, 860, 360,
        "Enter sides...",
        { fontSize: "28px", fontFamily: "Verdana", color: "#fff" }
    ).setVisible(false);

    this.luckInput = createInputField(
        this, 860, 420,
        "Enter luck factor...",
        { fontSize: "28px", fontFamily: "Verdana", color: "#fff" }
    ).setVisible(false);

    this.createDiceSubmitButton = createButton.call(
    this,
        'Create Dice',
        config.width / 2,
        config.height / 2 + 80,
        submitCustomDice.bind(this),
        '26px'
    ).setVisible(false);
	
	// Inputs hidden by default
    this.sidesInput.setVisible(false);
    this.luckInput.setVisible(false);
	
	// Load custom backgrounds
	applyBackground.call(this);

    // Hide splash screen after game is created
    document.getElementById('splash-screen').style.display = 'none';

    // Ensure the back button works as expected
    document.getElementById('back-button').addEventListener('click', () => {
        showMainMenu.call(this);
    });
}

function update() {}

function createButton(text, x, y, onClick, fontSize = '32px', backgroundColor = '#333') {
    return this.add.text(x, y, text, {
        fontSize: fontSize,
        fill: '#fff',
        backgroundColor: backgroundColor,
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', onClick, this);
}

function createText(x, y, text) {
    return this.add.text(x, y, text, {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana',
        align: 'center'
    }).setOrigin(0.5, 0.5);
}

function createInputField(scene, x, y, placeholder, style) {
    const field = scene.add.text(x, y, placeholder, style).setInteractive();

    field._placeholder = placeholder;
    field._realValue = "";  // Store the actual input

    // When clicked, remove placeholder
    field.on('pointerdown', () => {
        if (field.text === field._placeholder) {
            field.setText('');
        }
    });

    // Capture keyboard input
    scene.input.keyboard.on('keydown', (event) => {
        if (!field.inputing) return;

        if (event.key === "Backspace") {
            field._realValue = field._realValue.slice(0, -1);
        } else if (event.key.length === 1) {
            field._realValue += event.key;
        }

        field.setText(field._realValue || "");
    });

    // Detect focus/blur
    field.on('pointerdown', () => (field.inputing = true));

    scene.input.on('pointerdown', (pointer, gameObjects) => {
        if (!gameObjects.includes(field)) {
            // Lost focus → restore placeholder if empty
            field.inputing = false;

            if (!field._realValue) {
                field.setText(field._placeholder);
            }
        }
    });

    // Method to get the current value safely
    field.getValue = () => field._realValue || "";

    return field;
}

function submitCustomDice() {
    const sidesValue = Number(this.sidesInput.getValue());
    const luckValue  = Number(this.luckInput.getValue());

    // --- VALIDATION ---
    if (isNaN(sidesValue) || sidesValue < 6) {
        showAlert.call(this, "Invalid side count (min 6)", "error");
        return;
    }

    if (isNaN(luckValue) || luckValue < 0) {
        showAlert.call(this, "Invalid luck factor", "error");
        return;
    }

    // --- CREATE CUSTOM DICE ---
    customDiceArray.push({
        type: `D${sidesValue}`,
        sides: sidesValue,
        luckFactor: luckValue
    });

    showAlert.call(this, "Custom dice created!", "success");
    showSimulation.call(this);

    // Optional: Reset input fields
    this.sidesInput._realValue = "";
    this.sidesInput.setText(this.sidesInput._placeholder);

    this.luckInput._realValue = "";
    this.luckInput.setText(this.luckInput._placeholder);
}

function showCreateDiceMenu() {
    hideAllUI.call(this);

    // Reset placeholders and values
    this.sidesInput._realValue = "";
    this.sidesInput.setText(this.sidesInput._placeholder).setVisible(true);

    this.luckInput._realValue = "";
    this.luckInput.setText(this.luckInput._placeholder).setVisible(true);

    this.createDiceSubmitButton.setVisible(true);
    backButton.setVisible(true);
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.warn('No dice available!');
		showAlert.call(this, 'No dice available!', 'warning');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const dice = diceArray[Phaser.Math.Between(0, diceArray.length - 1)];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function rollSelectedDice() {
    if (diceArray.length === 0) {
        console.warn('No dice available!');
		showAlert.call(this, 'No dice available!', 'warning');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function switchDiceType() {
	if (diceArray.length === 0) {
        console.warn('No dice available!');
		showAlert.call(this, 'No dice available!', 'warning');
        return;
    }
	
    if (sfxEnabled) {
        this.switchSound.play();
    }
	
    selectedDiceIndex = (selectedDiceIndex + 1) % diceArray.length;
    this.resultText.setText(`Selected ${diceArray[selectedDiceIndex].type}`);
}

function rollCustomDice() {
    if (customDiceArray.length === 0) {
        console.warn('No custom dice available!');
		showAlert.call(this, 'No custom dice available!', 'warning');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const dice = customDiceArray[selectedCustomDiceIndex];
    const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
}

function rollRandomCustomDice() {
    if (customDiceArray.length === 0) {
        console.warn('No custom dice available!');
		showAlert.call(this, 'No custom dice available!', 'warning');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const randomIndex = Phaser.Math.Between(0, customDiceArray.length - 1);
    const dice = customDiceArray?.[randomIndex];
    const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
}

function switchCustomDiceType() {
	if (customDiceArray.length === 0) {
        console.warn('No custom dice available!');
		showAlert.call(this, 'No custom dice available!', 'warning');
        return;
    }
	
    if (sfxEnabled) {
        this.switchSound.play();
    }
	
    selectedCustomDiceIndex = (selectedCustomDiceIndex + 1) % customDiceArray.length;
    this.resultText.setText(`Selected ${customDiceArray[selectedCustomDiceIndex].type}`);
}

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
    let alertBox = document.getElementById('customAlert');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'customAlert';
        alertBox.style.position = 'fixed';
        alertBox.style.top = '10px';
        alertBox.style.right = '10px';
        alertBox.style.padding = '15px';
        alertBox.style.borderRadius = '5px';
        alertBox.style.color = '#fff';
        alertBox.style.zIndex = '1000';
		alertBox.style.fontSize = '16px';
		alertBox.style.fontFamily = 'Verdana';
        document.body.appendChild(alertBox);
    }

    if (type === 'error') {
        alertBox.style.backgroundColor = '#f00';
    } else if (type === 'success') {
        alertBox.style.backgroundColor = '#0f0';
    } else {
        alertBox.style.backgroundColor = '#00f';
    }

    alertBox.textContent = message;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 3000);
}

function showSimulation() {
    hideAllUI.call(this);
    rollRandomButton.setVisible(true);
    rollSelectedButton.setVisible(true);
    switchDiceButton.setVisible(true);
    createDiceButton.setVisible(true);
    rollCustomDiceButton.setVisible(true);
    rollRandomCustomDiceButton.setVisible(true);
	switchCustomDiceButton.setVisible(true);
    this.resultText.setVisible(true);
    backButton.setVisible(true);
}

function showHelp() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    helpText.setVisible(true);
}

function showSettings() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    settingsText.setVisible(true);

    if (!sfxToggleButton) {
        sfxToggleButton = createButton.call(this, 'SFX: On', config.width / 2, config.height / 2 + 150, toggleSFX, '24px').setVisible(true);
    } else {
        sfxToggleButton.setVisible(true);
        sfxToggleButton.setText(sfxEnabled ? 'SFX: On' : 'SFX: Off');
    }
	
	if (!backgroundToggleButton) {
        backgroundToggleButton = createButton.call(this, 'BG Colour: Black', config.width / 2, config.height / 2 + 200, toggleBackground.bind(this), '24px');
        backgroundToggleButton.setVisible(true);
    } else {
        backgroundToggleButton.setVisible(true);
    }
}

function toggleSFX() {
    sfxEnabled = !sfxEnabled;
    sfxToggleButton.setText(sfxEnabled ? 'SFX: On' : 'SFX: Off');

    if (this.diceSound) {
        this.diceSound.setMute(!sfxEnabled);
    }

    if (this.switchSound) {
        this.switchSound.setMute(!sfxEnabled);
    }
}

function toggleBackground() {
    selectedBackgroundIndex++;

    if (selectedBackgroundIndex >= backgroundsArray.length) {
        selectedBackgroundIndex = 0;
    }

    applyBackground.call(this);
}

function applyBackground() {
    const selected = backgroundsArray[selectedBackgroundIndex];

    // Set camera background color
    this.cameras.main.setBackgroundColor(selected.colorCode);

    // Determine optimal text color
    const textColor = getOptimalTextColor(selected.colorCode);

    // Update button color (if using BitmapText or Phaser Text)
    if (backgroundToggleButton) {
        backgroundToggleButton.setText(`BG Colour: ${selected.type}`);
		backgroundToggleButton.setStyle({ color: textColor });
    }
	
	// Update text color for all elements based on background color
	[this.playButton, this.helpButton, this.settingsButton, rollRandomButton, rollSelectedButton, 
    switchDiceButton, createDiceButton, rollCustomDiceButton, rollRandomCustomDiceButton, switchCustomDiceButton,
    helpText, settingsText, sfxToggleButton, backgroundToggleButton, backButton, this.changelogButton, changelogText, this.resultText, 
	this.sidesInput, this.luckInput, this.createDiceSubmitButton].forEach(element => {
        if (element) element.setStyle({ color: textColor });
    });
}

function getLuminance(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Luminance formula (WCAG standard)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getOptimalTextColor(bgHex) {
    const lum = getLuminance(bgHex);

    // Thresholds:
    // >0.7 = very bright → use black
    // >0.5 = light → use very dark gray
    // else → use white
    if (lum > 0.7) return '#000000';
    if (lum > 0.5) return '#222222';
    return '#FFFFFF';
}

function showMainMenu() {
    hideAllUI.call(this);
    this.playButton.setVisible(true);
    this.helpButton.setVisible(true);
    this.settingsButton.setVisible(true);
    this.changelogButton.setVisible(true);
}

function hideAllUI() {
    [
        this.playButton, this.helpButton, this.settingsButton, this.changelogButton,
        rollRandomButton, rollSelectedButton, switchDiceButton, createDiceButton,
        rollCustomDiceButton, rollRandomCustomDiceButton, switchCustomDiceButton,
        helpText, settingsText, sfxToggleButton, backgroundToggleButton, backButton,
        changelogText, this.resultText, this.sidesInput, this.luckInput, this.createDiceSubmitButton
    ].forEach(element => {
        if (element) element.setVisible(false);
    });
}

function showChangelog() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    changelogText.setVisible(true);
}