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
let selectedDiceIndex = 0;
let rollRandomButton, rollSelectedButton, switchDiceButton, createDiceButton, rollCustomDiceButton, rollCustomRandomDiceButton;
let backButton;
let inputContainer;
let sideInputField, luckFactorInputField, submitButton;
let helpText, settingsText, changelogText;
let sfxToggleButton;
let sfxEnabled = true;

function preload() {
    this.load.json('dices', 'config/dices.json');
    this.load.json('customDices', 'config/customDices.json');
    this.load.audio('diceSound', 'assets/sfx/dice.mp3');
    this.load.audio('switchSound', 'assets/sfx/button.mp3');
}

function create() {
    diceArray = this.cache.json.get('dices');
    customDiceArray = this.cache.json.get('customDices');

    this.diceSound = this.sound.add('diceSound');
    this.switchSound = this.sound.add('switchSound');

    // Create UI buttons
    this.playButton = createButton.call(this, 'Play', config.width / 2, config.height / 2 - 150, showSimulation);
    this.helpButton = createButton.call(this, 'Help', config.width / 2, config.height / 2 - 50, showHelp);
    this.settingsButton = createButton.call(this, 'Settings', config.width / 2, config.height / 2 + 50, showSettings);
    this.changelogButton = createButton.call(this, 'Changelog', config.width / 2, config.height / 2 + 150, showChangelog);

    backButton = createButton.call(this, 'Back', 10, 10, showMainMenu, '24px', '#f00').setVisible(false);

    rollRandomButton = createButton.call(this, 'Roll Random Dice', config.width / 2, config.height / 2 - 100, rollRandomDice).setVisible(false);
    rollSelectedButton = createButton.call(this, 'Roll Selected Dice', config.width / 2, config.height / 2 - 50, rollSelectedDice).setVisible(false);
    switchDiceButton = createButton.call(this, 'Switch Dice Type', config.width / 2, config.height / 2, switchDiceType).setVisible(false);
    createDiceButton = createButton.call(this, 'Create Dice', config.width / 2, config.height / 2 + 50, showCreateDiceMenu).setVisible(false);
    rollCustomDiceButton = createButton.call(this, 'Roll Custom Dice', config.width / 2, config.height / 2 + 100, rollCustomDice).setVisible(false);
    rollCustomRandomDiceButton = createButton.call(this, 'Roll Custom Random Dice', config.width / 2, config.height / 2 + 150, rollCustomRandomDice).setVisible(false);

    this.resultText = this.add.text(config.width / 2, config.height / 2 + 200, '', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setVisible(false);

    helpText = createText.call(this, config.width / 2, config.height / 2, 'Help Information: \n\n Here you can learn how to use the dice simulation...').setVisible(false);
    settingsText = createText.call(this, config.width / 2, config.height / 2, 'Settings Options: \n\n Customize your game settings here...').setVisible(false);
    changelogText = createText.call(this, config.width / 2, config.height / 2, 'Changelog: \n\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs').setVisible(false);

    // Create input fields and submit button
    createDiceInputs.call(this);

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

function createDOMInputField(placeholder, id) {
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = placeholder;
    inputField.id = id;
    inputField.style.width = '180px';
    inputField.style.height = '30px';
    inputField.style.fontSize = '24px';
    inputField.style.textAlign = 'center';
    inputField.style.marginBottom = '10px';
    return inputField;
}

function createDOMButton(text, onClick, id) {
    const button = document.createElement('button');
    button.textContent = text;
    button.id = id;
    button.style.padding = '10px 20px';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', onClick);

    return button;
}

function createDiceInputs() {
    // Ensure the ui-container element exists
    const uiContainer = document.getElementById('ui-container');
    if (!uiContainer) {
        console.error('UI Container element not found');
        return;
    }

    // Create input fields and submit button
    sideInputField = createDOMInputField('Number of Sides', 'sideInputField');
    luckFactorInputField = createDOMInputField('Luck Factor', 'luckFactorInputField');
    submitButton = createDOMButton('Create Dice', createDiceSubmit, 'submitButton');

    // Add them to the DOM
    uiContainer.appendChild(sideInputField);
    uiContainer.appendChild(luckFactorInputField);
    uiContainer.appendChild(submitButton);

    // Hide input fields and button initially
    hideInputFields();
}

function createDiceSubmit() {
    // Get values from the input fields by their IDs
    const sideInputField = document.getElementById('sideInputField');
    const luckFactorInputField = document.getElementById('luckFactorInputField');

    // Log the input field elements for debugging
    console.log('sideInputField:', sideInputField);
    console.log('luckFactorInputField:', luckFactorInputField);

    if (!sideInputField || !luckFactorInputField) {
        console.error('Input fields not found');
        return;
    }

    const sideInput = sideInputField.value.trim();
    const luckInput = luckFactorInputField.value.trim();

    // Log the input values for debugging
    console.log(`Side Input: "${sideInput}"`);
    console.log(`Luck Input: "${luckInput}"`);

    // Check if input values are not empty
    if (sideInput === "") {
        showAlert.call(this, 'Side input cannot be empty.', 'error');
        return;
    }
    if (luckInput === "") {
        showAlert.call(this, 'Luck input cannot be empty.', 'error');
        return;
    }

    // Convert input values to numbers
    const sides = parseInt(sideInput, 10);
    const luckFactor = parseFloat(luckInput);

    // Log the converted values for debugging
    console.log(`Converted Sides: ${sides}`);
    console.log(`Converted Luck Factor: ${luckFactor}`);

    // Validate the inputs
    if (isNaN(sides) || sides < 6) {
        showAlert.call(this, 'Invalid number of sides. Must be at least 6.', 'error');
        return;
    }
    if (isNaN(luckFactor) || luckFactor < 0) {
        showAlert.call(this, 'Invalid luck factor. Must be a non-negative number.', 'error');
        return;
    }

    // Create a new dice
    const newDice = { type: `D${sides}`, sides: sides, luckFactor: luckFactor };
    customDiceArray.push(newDice);
    showAlert.call(this, 'Dice created successfully!', 'success');

    // Hide input fields and reset values
    hideInputFields.call(this);
}

function hideInputFields() {
    if (sideInputField) sideInputField.style.display = 'none';
    if (luckFactorInputField) luckFactorInputField.style.display = 'none';
    if (submitButton) submitButton.style.display = 'none';
}

function showCreateDiceMenu() {
    hideAllUI.call(this);
    createDiceInputs.call(this); // Ensure inputs are created
    if (sideInputField) sideInputField.style.display = 'block';
    if (luckFactorInputField) luckFactorInputField.style.display = 'block';
    if (submitButton) submitButton.style.display = 'block';

    if (backButton) backButton.setVisible(true);
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
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
        console.error('No dice available!');
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
    if (sfxEnabled) {
        this.switchSound.play();
    }
    selectedDiceIndex = (selectedDiceIndex + 1) % diceArray.length;
    this.resultText.setText(`Selected ${diceArray[selectedDiceIndex].type}`);
}

function rollCustomDice() {
    if (customDiceArray.length === 0) {
        console.error('No custom dice available!');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const dice = customDiceArray[selectedDiceIndex];
    const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
}

function rollCustomRandomDice() {
    if (customDiceArray.length === 0) {
        console.error('No custom dice available!');
        return;
    }

    if (sfxEnabled) {
        this.diceSound.play();
    }

    const randomIndex = Phaser.Math.Between(0, customDiceArray.length - 1);
    const dice = customDiceArray[randomIndex];
    const result = rollWithLuckFactor(dice.sides, dice.luckFactor);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
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
    rollCustomRandomDiceButton.setVisible(true);
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

function showMainMenu() {
    hideAllUI.call(this);
    this.playButton.setVisible(true);
    this.helpButton.setVisible(true);
    this.settingsButton.setVisible(true);
    this.changelogButton.setVisible(true);
}

function hideAllUI() {
    [this.playButton, this.helpButton, this.settingsButton, rollRandomButton, rollSelectedButton, 
    switchDiceButton, createDiceButton, rollCustomDiceButton, rollCustomRandomDiceButton,
    helpText, settingsText, sfxToggleButton, backButton, this.changelogButton, changelogText].forEach(element => {
        if (element) element.setVisible(false);
    });
}

function showChangelog() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    changelogText.setVisible(true);
}
