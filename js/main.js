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

game.events.once('ready', () => {
    document.getElementById('splash-screen').style.display = 'none';
});

let diceArray = [];
let customDiceArray = [];
let selectedDiceIndex = 0;
let rollRandomButton, rollSelectedButton, switchDiceButton, createDiceButton, rollCustomDiceButton, rollCustomRandomDiceButton;
let backButton;
let sideInputField, luckFactorInputField, submitButton;
let helpText, settingsText, changelogText;

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
    sideInputField = createInputField.call(this, config.width / 2, config.height / 2 - 50, 'Number of Sides');
    luckFactorInputField = createInputField.call(this, config.width / 2, config.height / 2, 'Luck Factor');
    submitButton = createButton.call(this, 'Create Dice', config.width / 2, config.height / 2 + 100, createDiceSubmit, '24px').setVisible(false);
    
    this.input.on('pointerdown', (pointer) => {
        if (!sideInputField.getBounds().contains(pointer.x, pointer.y) &&
            !luckFactorInputField.getBounds().contains(pointer.x, pointer.y)) {
            hideInputFields.call(this);
        }
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

function createInputField(x, y, placeholder) {
    const inputField = this.add.text(x, y, placeholder, {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 10, y: 5 },
        fontFamily: 'Verdana',
        wordWrap: { width: 200 }
    }).setOrigin(0.5, 0.5).setInteractive();

    inputField.input.enabled = false; // Disable default interaction

    inputField.on('pointerdown', function () {
        this.inputField = this.scene.add.dom(x, y).createFromHTML(`<input type="text" placeholder="${placeholder}" style="width: 180px; height: 30px; font-size: 24px; text-align: center;">`);
        this.inputField.addListener('keydown').on('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleInputSubmit.call(this, placeholder);
            }
        });
        this.inputField.addListener('blur').on('blur', () => {
            this.inputField.destroy();
        });
    }, { inputField });

    return inputField;
}

function handleInputSubmit(placeholder) {
    const inputField = placeholder === 'Number of Sides' ? sideInputField : luckFactorInputField;
    const value = inputField.getChildByID('input').value;

    if (placeholder === 'Number of Sides') {
        const sides = parseInt(value, 10);
        if (isNaN(sides) || sides < 1) {
            showAlert.call(this, 'Invalid number of sides.', 'error');
            return;
        }
        // Store sides value for later use
        this.sides = sides;
    } else if (placeholder === 'Luck Factor') {
        const luckFactor = parseFloat(value);
        if (isNaN(luckFactor) || luckFactor < 0) {
            showAlert.call(this, 'Invalid luck factor.', 'error');
            return;
        }
        // Store luck factor value for later use
        this.luckFactor = luckFactor;
    }

    if (this.sides && this.luckFactor !== undefined) {
        // Create a new dice
        const newDice = { type: `D${this.sides}`, sides: this.sides, luckFactor: this.luckFactor };
        customDiceArray.push(newDice);
        showAlert.call(this, 'Dice created successfully!', 'success');

        // Reset values
        this.sides = null;
        this.luckFactor = null;

        hideInputFields.call(this);
    }
}

function hideInputFields() {
    sideInputField.setVisible(false);
    luckFactorInputField.setVisible(false);
    submitButton.setVisible(false);
}

function createDiceSubmit() {
    handleInputSubmit.call(this, 'Number of Sides');
    handleInputSubmit.call(this, 'Luck Factor');
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    if (this.sfxEnabled) {
        this.diceSound.play();
    }

    const randomIndex = Phaser.Math.Between(0, diceArray.length - 1);
    const dice = diceArray[randomIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function rollSelectedDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    if (this.sfxEnabled) {
        this.diceSound.play();
    }

    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function switchDiceType() {
    if (this.sfxEnabled) {
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
        roll = Math.floor(roll * luckFactor);
        roll = Phaser.Math.Clamp(roll, 1, sides);
    } else if (luckFactor > 1) {
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

function showCreateDiceMenu() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    sideInputField.setVisible(true);
    luckFactorInputField.setVisible(true);
    submitButton.setVisible(true);
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

    if (!this.sfxToggleButton) {
        this.sfxToggleButton = createButton.call(this, 'SFX: On', config.width / 2, config.height / 2 + 150, toggleSFX, '24px').setVisible(true);
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
    hideAllUI.call(this);
    this.playButton.setVisible(true);
    this.helpButton.setVisible(true);
    this.settingsButton.setVisible(true);
    this.changelogButton.setVisible(true);
}

function hideAllUI() {
    [this.playButton, this.helpButton, this.settingsButton, rollRandomButton, rollSelectedButton, 
    switchDiceButton, createDiceButton, rollCustomDiceButton, rollCustomRandomDiceButton,
    helpText, settingsText, this.sfxToggleButton, backButton, this.changelogButton, changelogText].forEach(element => {
        if (element) element.setVisible(false);
    });
}

function showChangelog() {
    hideAllUI.call(this);
    backButton.setVisible(true);
    changelogText.setVisible(true);
}
