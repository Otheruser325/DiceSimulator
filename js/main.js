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

    // Create main menu buttons
    createMainMenuButtons.call(this);

    // Create game UI buttons
    createGameButtons.call(this);

    // Display area for results
    this.resultText = this.add.text(config.width / 2, config.height / 2 + 200, '', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5);

    // Initialize UI visibility
    showMainMenu.call(this);
}

function update() {}

function createMainMenuButtons() {
    // Main menu buttons
    this.playButton = this.add.text(config.width / 2, config.height / 2 - 150, 'Play', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', showSimulation, this);

    this.helpButton = this.add.text(config.width / 2, config.height / 2 - 50, 'Help', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', showHelp, this);

    this.settingsButton = this.add.text(config.width / 2, config.height / 2 + 50, 'Settings', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', showSettings, this);

    backButton = this.add.text(10, 10, 'Back', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#f00',
        padding: { x: 10, y: 5 },
        fontFamily: 'Verdana'
    }).setOrigin(0, 0).setInteractive().on('pointerdown', showMainMenu, this).setVisible(false);
}

function createGameButtons() {
    rollRandomButton = this.add.text(config.width / 2, config.height / 2 - 150, 'Roll Random Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollRandomDice, this).setVisible(false);

    rollSelectedButton = this.add.text(config.width / 2, config.height / 2, 'Roll Selected Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollSelectedDice, this).setVisible(false);

    switchDiceButton = this.add.text(config.width / 2, config.height / 2 + 150, 'Switch Dice Type', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', switchDiceType, this).setVisible(false);

    createDiceButton = this.add.text(config.width / 2, config.height / 2 + 250, 'Create Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', showCreateDiceMenu, this).setVisible(false);

    rollCustomDiceButton = this.add.text(config.width / 2, config.height / 2 + 350, 'Roll Custom Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollCustomDice, this).setVisible(false);

    rollCustomRandomDiceButton = this.add.text(config.width / 2, config.height / 2 + 450, 'Roll Custom Random Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollCustomRandomDice, this).setVisible(false);
}

function showSimulation() {
    // Hide main menu buttons and show game UI
    this.playButton.setVisible(false);
    this.helpButton.setVisible(false);
    this.settingsButton.setVisible(false);
    
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
    // Hide main menu and game UI, show create dice UI
    rollRandomButton.setVisible(false);
    rollSelectedButton.setVisible(false);
    switchDiceButton.setVisible(false);
    createDiceButton.setVisible(false);
    rollCustomDiceButton.setVisible(false);
    rollCustomRandomDiceButton.setVisible(false);
    this.resultText.setVisible(false);
    backButton.setVisible(true);

    // Display create dice UI elements
    sideInputText = this.add.text(config.width / 2, config.height / 2 - 100, 'Enter Dice Sides:', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5);

    luckFactorText = this.add.text(config.width / 2, config.height / 2, 'Enter Luck Factor:', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5);

    sideInput = this.add.text(config.width / 2, config.height / 2 + 100, '', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', () => {
        // Handle dice sides input
        // This is a placeholder, ideally use Phaser's input plugin
    });

    luckFactorInput = this.add.text(config.width / 2, config.height / 2 + 200, '', {
        fontSize: '24px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', () => {
        // Handle luck factor input
        // This is a placeholder, ideally use Phaser's input plugin
    });

    createDiceSubmitButton = this.add.text(config.width / 2, config.height / 2 + 300, 'Create Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 },
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', () => {
        const sides = parseInt(sideInput.text);
        const luckFactor = parseFloat(luckFactorInput.text);
        if (sides && !isNaN(luckFactor)) {
            createCustomDice(sides, luckFactor);
            fetchCustomDices(); // Update custom dice array
            showSimulation.call(this); // Return to game UI
        }
    });
}

function showHelp() {
    // Show help UI
}

function showSettings() {
    // Show settings UI
}

function showMainMenu() {
    // Hide all UI elements and show main menu
    rollRandomButton.setVisible(false);
    rollSelectedButton.setVisible(false);
    switchDiceButton.setVisible(false);
    createDiceButton.setVisible(false);
    rollCustomDiceButton.setVisible(false);
    rollCustomRandomDiceButton.setVisible(false);
    if (sideInputText) sideInputText.setVisible(false);
    if (luckFactorText) luckFactorText.setVisible(false);
    if (sideInput) sideInput.setVisible(false);
    if (luckFactorInput) luckFactorInput.setVisible(false);
    if (createDiceSubmitButton) createDiceSubmitButton.setVisible(false);
    backButton.setVisible(false);
    this.resultText.setVisible(false);
    createMainMenuButtons.call(this);
}

function createCustomDice(sides, luckFactor) {
    const dice = {
        type: `d${sides}`,
        sides: sides,
        luckFactor: luckFactor
    };
    customDiceArray.push(dice);
    // Optionally save to server or localStorage here
    // saveCustomDice(dice); // Uncomment if using server-side storage
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    // Play dice sound effect
    this.diceSound.play();

    const randomIndex = Phaser.Math.Between(0, diceArray.length - 1);
    const dice = diceArray[randomIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled Random ${dice.type}: ${result}`);
}

function rollSelectedDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    // Play dice sound effect
    this.diceSound.play();

    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled Selected ${dice.type}: ${result}`);
}

function switchDiceType() {
    // Logic to switch between dice types
}

function rollCustomDice() {
    if (customDiceArray.length === 0) {
        console.error('No custom dice available!');
        return;
    }

    // Play dice sound effect
    this.diceSound.play();

    const dice = customDiceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
}

function rollCustomRandomDice() {
    if (customDiceArray.length === 0) {
        console.error('No custom dice available!');
        return;
    }

    // Play dice sound effect
    this.diceSound.play();

    const randomIndex = Phaser.Math.Between(0, customDiceArray.length - 1);
    const dice = customDiceArray[randomIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`);
}

function fetchCustomDices() {
    // Fetch custom dice data from server or localStorage
    // Example: fetch('/customDices').then(response => response.json()).then(data => { customDiceArray = data; });
}
