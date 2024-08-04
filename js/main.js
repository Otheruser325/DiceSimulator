const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let diceArray = [];
let rollRandomButton;
let rollSelectedButton;
let switchDiceButton;
let selectedDiceIndex = 0;

function preload() {
    this.load.json('dices', 'config/dices.json');
    this.load.audio('diceSound', 'assets/sfx/dice.mp3');
    this.load.audio('switchSound', 'assets/sfx/switch.mp3');
}

function create() {
    diceArray = this.cache.json.get('dices');
    
    // Load sound effects
    this.diceSound = this.sound.add('diceSound');
    this.switchSound = this.sound.add('switchSound');
    
    // Button to roll a random dice
    rollRandomButton = this.add.text(400, 200, 'Roll Random Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
    }).setInteractive().on('pointerdown', rollRandomDice, this);
    
    // Button to roll a selected dice
    rollSelectedButton = this.add.text(400, 300, 'Roll Selected Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
    }).setInteractive().on('pointerdown', rollSelectedDice, this);

    // Button to switch dice type
    switchDiceButton = this.add.text(400, 400, 'Switch Dice Type', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
    }).setInteractive().on('pointerdown', switchDiceType, this);

    // Display area for results
    this.resultText = this.add.text(400, 500, '', {
        fontSize: '24px',
        fill: '#fff'
    }).setOrigin(0.5, 0.5);
}

function update() {
    // Optional: Update game state here if needed
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
