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
let sideInput, luckFactorInput, sideInputText, luckFactorText, createDiceSubmitButton;
let helpText, settingsText;

function preload() {
    this.load.json('dices', 'config/dices.json');
    this.load.json('customDices', 'config/customDices.json');
    this.load.audio('diceSound', 'assets/sfx/dice.mp3');
    this.load.audio('switchSound', 'assets/sfx/button.mp3');
}

function create() {
    diceArray = this.cache.json.get('dices');
    customDiceArray = this.cache.json.get('customDices');

    // Load sound effects
    this.diceSound = this.sound.add('diceSound');
    this.switchSound = this.sound.add('switchSound');
    this.sfxEnabled = true;

    // Create UI buttons
    this.playButton = createButton.call(this, 'Play', config.width / 2, config.height / 2 - 150, showSimulation);
    this.helpButton = createButton.call(this, 'Help', config.width / 2, config.height / 2 - 50, showHelp);
    this.settingsButton = createButton.call(this, 'Settings', config.width / 2, config.height / 2 + 50, showSettings);

    backButton = createButton.call(this, 'Back', 10, 10, showMainMenu, 24, '#f00').setVisible(false);

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

function createInteractiveText(x, y, initialText, onClick) {
    return this.add.text(x, y, initialText, {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', onClick, this);
}

function showSimulation() {
    // Hide all UI elements except for the dice rolling and back buttons
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

function showCreateDiceMenu() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    
    if (!sideInputText) {
        sideInputText = createText.call(this, config.width / 2, config.height / 2 - 100, 'Enter Dice Sides:');
    } else {
        sideInputText.setVisible(true);
    }

    if (!luckFactorText) {
        luckFactorText = createText.call(this, config.width / 2, config.height / 2 - 50, 'Enter Luck Factor:');
    } else {
        luckFactorText.setVisible(true);
    }

    if (!sideInput) {
        sideInput = createInteractiveText.call(this, config.width / 2, config.height / 2, '', handleSideInput);
    } else {
        sideInput.setVisible(true);
    }

    if (!luckFactorInput) {
        luckFactorInput = createInteractiveText.call(this, config.width / 2, config.height / 2 + 50, '', handleLuckFactorInput);
    } else {
        luckFactorInput.setVisible(true);
    }

    if (!createDiceSubmitButton) {
        createDiceSubmitButton = createButton.call(this, 'Create Dice', config.width / 2, config.height / 2 + 100, createDiceSubmit);
    } else {
        createDiceSubmitButton.setVisible(true);
    }
}

function showHelp() {
    // Hide all UI elements except for the back button
    hideAllUI.call(this);
    backButton.setVisible(true);
    helpText.setVisible(true);
}

function showSettings() {
    // Hide all UI elements except for the back button
    hideAllUI.call(this);
    backButton.setVisible(true);
    settingsText.setVisible(true);

    // Add or update the toggle button for sound effects
    if (!this.sfxToggleButton) {
        this.sfxToggleButton = createButton.call(this, 'SFX: On', config.width / 2, config.height / 2 + 100, toggleSFX);
    } else {
        this.sfxToggleButton.setVisible(true);
        this.sfxToggleButton.setText(this.sfxEnabled ? 'SFX: On' : 'SFX: Off');
    }
}

function toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    this.sfxToggleButton.setText(this.sfxEnabled ? 'SFX: On' : 'SFX: Off');

    if (this.diceSound) {
        this.diceSound.setMute(!this.sfxEnabled);
    }

    if (this.switchSound) {
        this.switchSound.setMute(!this.sfxEnabled);
    }
}

function showMainMenu() {
    // Hide all UI elements and show main menu buttons
    hideAllUI.call(this);
    this.playButton.setVisible(true);
    this.helpButton.setVisible(true);
    this.settingsButton.setVisible(true);
}

function hideAllUI() {
    // Hide all buttons and texts
    [this.playButton, this.helpButton, this.settingsButton, rollRandomButton, rollSelectedButton, 
    switchDiceButton, createDiceButton, rollCustomDiceButton, rollCustomRandomDiceButton,
    sideInputText, luckFactorText, sideInput, luckFactorInput, createDiceSubmitButton, 
    helpText, settingsText, this.sfxToggleButton, backButton].forEach(element => {
        if (element) element.setVisible(false);
    });
}

function createInteractiveText(x, y, initialText, onClick) {
    return this.add.text(x, y, initialText, {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', onClick, this);
}

function createInputField(id, x, y) {
    let inputField = document.getElementById(id);

    if (!inputField) {
        inputField = document.createElement('input');
        inputField.id = id;
        inputField.type = 'text';
        inputField.style.position = 'absolute';
        inputField.style.zIndex = '1000';
        document.body.appendChild(inputField);
    }

    inputField.style.left = `${x}px`;
    inputField.style.top = `${y}px`;
    inputField.style.display = 'block';
    inputField.focus();

    // Add event listeners
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if in a form
            handleInputSubmit(id);
        }
    });

    return inputField;
}

function handleInputSubmit(id) {
    const inputField = document.getElementById(id);
    if (id === 'sideInputField') {
        sideInput.text = inputField.value;
    } else if (id === 'luckFactorInputField') {
        luckFactorInput.text = inputField.value;
    }
    hideInputFields();
}

function hideInputFields() {
    document.getElementById('sideInputField')?.style.setProperty('display', 'none');
    document.getElementById('luckFactorInputField')?.style.setProperty('display', 'none');
}

// Click handler to hide input fields when clicking outside
document.addEventListener('mousedown', (event) => {
    if (!event.target.closest('#sideInputField') && !event.target.closest('#luckFactorInputField')) {
        hideInputFields();
    }
});

function handleSideInput() {
    const x = config.width / 2 - 50;
    const y = config.height / 2 - 50;
    createInputField('sideInputField', x, y);
}

function handleLuckFactorInput() {
    const x = config.width / 2 - 50;
    const y = config.height / 2 + 50;
    createInputField('luckFactorInputField', x, y);
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    // Play dice sound effect if SFX is turned on
    if (this.sfxEnabled) {
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

    // Play dice sound effect if SFX is turned on
    if (this.sfxEnabled) {
        this.diceSound.play();
    }

    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled Selected ${dice.type}: ${result}`);
}

function switchDiceType() {
    // Placeholder logic to switch between dice types
    this.switchSound.play();
    selectedDiceIndex = (selectedDiceIndex + 1) % diceArray.length;
    const dice = diceArray[selectedDiceIndex];
    this.resultText.setText(`Switched to ${dice.type}`);
}

function createDiceSubmit() {
    let sides = parseInt(sideInput.text.replace(/^d/, '')); // Remove 'd' if present
    const luckFactor = parseFloat(luckFactorInput.text);
    if (sides && !isNaN(luckFactor) && sides >= 6) { // Ensure sides >= 6
        createCustomDice(sides, luckFactor);
        fetchCustomDices(); // Update custom dice array
        showSimulation.call(this); // Return to game UI
    } else {
        console.error('Invalid sides or luck factor');
    }
}

function createCustomDice(sides, luckFactor) {
    if (sides < 6) {
        console.error('Dice must have at least 6 sides.');
        return;
    }

    const dice = {
        type: `d${sides}`,
        sides: sides,
        luckFactor: luckFactor
    };

    customDiceArray.push(dice);
}

function rollCustomDice() {
    if (customDiceArray.length === 0) {
        console.error('No custom dice available!');
        return;
    }

    // Play dice sound effect if SFX is turned on
    if (this.sfxEnabled) {
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

    // Play dice sound effect if SFX is turned on
    if (this.sfxEnabled) {
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
        // Decrease likelihood of higher rolls (more likely to get lower numbers)
        roll = Math.floor(roll * luckFactor);
        roll = Phaser.Math.Clamp(roll, 1, sides);
    } else if (luckFactor > 1) {
        // Increase likelihood of higher rolls (more likely to get higher numbers)
        roll = Math.ceil(roll * luckFactor / (luckFactor + (sides - roll)));
        roll = Phaser.Math.Clamp(roll, 1, sides);
    }

    return roll;
}

function fetchCustomDices() {
    fetch('/customDices')
        .then(response => response.json())
        .then(data => {
            customDiceArray = data;
        })
        .catch(error => console.error('Error fetching custom dice:', error));
}

function saveCustomDices() {
    fetch('/customDices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(customDiceArray)
    })
    .then(response => response.text())
    .then(message => console.log(message))
    .catch(error => console.error('Error saving custom dice:', error));
}

function showAlert(message, type = 'error') {
    // Create alert element if not exists
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

    // Set styles based on alert type
    if (type === 'error') {
        alertBox.style.backgroundColor = '#f00';
    } else if (type === 'success') {
        alertBox.style.backgroundColor = '#0f0';
    } else {
        alertBox.style.backgroundColor = '#00f';
    }

    alertBox.textContent = message;
    alertBox.style.display = 'block';

    // Hide alert after 3 seconds
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 3000);
}
