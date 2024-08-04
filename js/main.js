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
let selectedDiceIndex = 0;

function preload() {
    this.load.json('dices', 'config/dices.json');
}

function create() {
    diceArray = this.cache.json.get('dices');
    
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

    document.getElementById('result').innerText = '';
}

function update() {
    // Optional: Update game state here if needed
}

function rollRandomDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }
    const randomIndex = Phaser.Math.Between(0, diceArray.length - 1);
    const dice = diceArray[randomIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    document.getElementById('result').innerText = `Rolled ${dice.type}: ${result}`;
}

function rollSelectedDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }
    const dice = diceArray[selectedDiceIndex];
    const result = Phaser.Math.Between(1, dice.sides);
    document.getElementById('result').innerText = `Rolled ${dice.type}: ${result}`;
}

function switchDiceType() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }
    selectedDiceIndex = (selectedDiceIndex + 1) % diceArray.length;
    document.getElementById('result').innerText = `Selected Dice: ${diceArray[selectedDiceIndex].type}`;
}
