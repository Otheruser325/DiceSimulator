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
let sideInput, luckFactorInput, createDiceSubmitButton;
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
    changelogText = createText.call(this, config.width / 2, config.height / 2, 'Changelog: \n\n- Added custom dice creation\n- Implemented luck factor for custom dice\n- Added sound effects toggle\n- Fixed various bugs').setVisible(false);

    // Set up input fields
    sideInput = document.getElementById('sideInputField');
    luckFactorInput = document.getElementById('luckFactorInputField');

    sideInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleInputSubmit('sideInputField');
        }
    });

    luckFactorInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleInputSubmit('luckFactorInputField');
        }
    });

    // Hide input fields initially
    sideInput.style.display = 'none';
    luckFactorInput.style.display = 'none';

    // Handle clicks outside input fields to hide them
    document.addEventListener('mousedown', (event) => {
        if (!sideInput.contains(event.target) && !luckFactorInput.contains(event.target)) {
            hideInputFields();
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

function handleInputSubmit(id) {
    const inputField = document.getElementById(id);
    if (id === 'sideInputField') {
        // Validate and store side input
        const sides = parseInt(inputField.value, 10);
        if (isNaN(sides) || sides < 1) {
            showAlert('Invalid number of sides.', 'error');
            return;
        }
    } else if (id === 'luckFactorInputField') {
        // Validate and store luck factor input
        const luckFactor = parseFloat(inputField.value);
        if (isNaN(luckFactor)) {
            showAlert('Invalid luck factor.', 'error');
            return;
        }
    }

    hideInputFields();
}

function hideInputFields() {
    sideInput.style.display = 'none';
    luckFactorInput.style.display = 'none';
}

function handleSideInput() {
    const x = config.width / 2 - 50;
    const y = config.height / 2 - 50;
    sideInput.style.left = `${x}px`;
    sideInput.style.top = `${y}px`;
    sideInput.style.display = 'block';
    sideInput.focus();
}

function handleLuckFactorInput() {
    const x = config.width / 2 - 50;
    const y = config.height / 2 + 50;
    luckFactorInput.style.left = `${x}px`;
    luckFactorInput.style.top = `${y}px`;
    luckFactorInput.style.display = 'block';
    luckFactorInput.focus();
}

function createDiceSubmit() {
    const sides = parseInt(sideInput.value, 10);
    const luckFactor = parseFloat(luckFactorInput.value);

    if (isNaN(sides) || sides < 1) {
        showAlert('Invalid number of sides.', 'error');
        return;
    }

    if (isNaN(luckFactor)) {
        showAlert('Invalid luck factor.', 'error');
        return;
    }

    const dice = {
        type: `d${sides}`,
        sides: sides,
        luckFactor: luckFactor
    };

    customDiceArray.push(dice);
    saveCustomDices();
    showAlert('Custom dice created successfully!', 'success');
    hideInputFields();
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

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

    if (this.sfxEnabled) {
        this.diceSound.play();
    }

    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function switchDiceType() {
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
    handleSideInput();
    handleLuckFactorInput();

    if (!createDiceSubmitButton) {
        createDiceSubmitButton = createButton.call(this, 'Create Dice', config.width / 2, config.height / 2 + 150, createDiceSubmit, '24px').setVisible(true);
    } else {
        createDiceSubmitButton.setVisible(true);
    }
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
