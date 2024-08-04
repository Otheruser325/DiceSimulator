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
let rollButton;

function preload() {
    this.load.json('dices', 'config/dices.json');
}

function create() {
    diceArray = this.cache.json.get('dices');
    
    rollButton = this.add.text(400, 300, 'Roll Random Dice', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
    }).setInteractive().on('pointerdown', rollDice, this);

    document.getElementById('roll-dice').addEventListener('click', rollDice.bind(this));
}

function update() {
    // This could be used for real-time updates, if needed
}

function rollDice() {
    if (diceArray.length === 0) {
        console.error('No dice available!');
        return;
    }

    const randomIndex = Phaser.Math.Between(0, diceArray.length - 1);
    const dice = diceArray[randomIndex];
    const result = Phaser.Math.Between(1, dice.sides);

    document.getElementById('result').innerText = `Rolled a ${dice.type}: ${result}`;
}
