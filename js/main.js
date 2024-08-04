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
let rollRandomButton;
let rollSelectedButton;
let switchDiceButton;
let selectedDiceIndex = 0;
let playButton, helpButton, settingsButton, backButton;

function preload() {
    this.load.json('dices', 'config/dices.json');
    this.load.audio('diceSound', 'assets/sfx/dice.mp3');
    this.load.audio('switchSound', 'assets/sfx/button.mp3');
}

function create() {
    diceArray = this.cache.json.get('dices');
    
    // Load sound effects
    this.diceSound = this.sound.add('diceSound');
    this.switchSound = this.sound.add('switchSound');
    
    // Create buttons
    createMainMenuButtons.call(this);
    createGameButtons.call(this);

    // Display area for results
    this.resultText = this.add.text(config.width / 2, config.height / 2 + 100, '', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Verdana' // Phaser's default font family
    }).setOrigin(0.5, 0.5);

    // Initialize UI visibility
    showMainMenu.call(this);
}

function update() {
    // Optional: Update game state here if needed
}

function createMainMenuButtons() {
    playButton = document.getElementById('play-button');
    helpButton = document.getElementById('help-button');
    settingsButton = document.getElementById('settings-button');
    backButton = document.getElementById('back-button');
    
    playButton.addEventListener('click', showSimulation.bind(this));
    helpButton.addEventListener('click', showHelp.bind(this));
    settingsButton.addEventListener('click', showSettings.bind(this));
    backButton.addEventListener('click', showMainMenu.bind(this));
}

function createGameButtons() {
    rollRandomButton = this.add.text(config.width / 2, config.height / 2 - 100, 'Roll Random Dice', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollRandomDice, this);
    
    rollSelectedButton = this.add.text(config.width / 2, config.height / 2, 'Roll Selected Dice', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', rollSelectedDice, this);

    switchDiceButton = this.add.text(config.width / 2, config.height / 2 + 100, 'Switch Dice Type', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Verdana'
    }).setOrigin(0.5, 0.5).setInteractive().on('pointerdown', switchDiceType, this);
}

function showSimulation() {
    // Hide main menu buttons and show game UI
    document.getElementById('ui-container').style.display = 'none';
    this.resultText.setText(''); // Clear any previous result

    // Show game buttons
    rollRandomButton.setVisible(true);
    rollSelectedButton.setVisible(true);
    switchDiceButton.setVisible(true);
    this.resultText.setVisible(true);

    // Show back button
    backButton.style.display = 'block';
}

function showHelp() {
    // Display help information
    this.resultText.setText('Help Section'); // Customize this as needed

    // Show back button
    backButton.style.display = 'block';
}

function showSettings() {
    // Display settings options
    this.resultText.setText('Settings Section'); // Customize this as needed

    // Show back button
    backButton.style.display = 'block';
}

function showMainMenu() {
    // Show main menu buttons and hide game UI
    document.getElementById('ui-container').style.display = 'block';
    rollRandomButton.setVisible(false);
    rollSelectedButton.setVisible(false);
    switchDiceButton.setVisible(false);
    this.resultText.setVisible(false);

    // Hide back button
    backButton.style.display = 'none';
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
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
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
    this.resultText.setText(`Rolled ${dice.type}: ${result}`);
}

function switchDiceType() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    // Play switch sound effect
    this.switchSound.play();

    selectedDiceIndex = (selectedDiceIndex + 1) % diceArray.length;
    this.resultText.setText(`Selected Dice: ${diceArray[selectedDiceIndex].type}`);
}
