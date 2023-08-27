const prompt = require('prompt-sync')({ sigint: true });

const hat = '^';
const hole = 'O';
const patch = '░';
const path = '*';

class Field {

    constructor(field) {
        this._field = field;
    }

    checkGameStatus(gameStatusMessage) {
        if (gameStatusMessage !== null) {
            console.log(gameStatusMessage);
            const playerInput = prompt('Play again, Y or N? ').toUpperCase();
            if (playerInput === 'Y') {
                const newFieldParams = this.getNewFieldParams();
                this.generateField(newFieldParams.rows, newFieldParams.cols, newFieldParams.holes);
                return 'reset';
            } else {
                return 'gameover';
            };
        }
        return 'active';
    }

    evaluateMove(row, col) {
        const colLength = this._field[0].length;
        const rowLength = this._field.length;

        if (row < 0 || row === rowLength || col < 0 || col === colLength) return 'Game over! You fell off the field!';
        else if (this._field[row][col] === hole) return 'Game over! You fell in a hole!';
        else if (this._field[row][col] === hat) return 'You win! You found your hat!'
        else {
            this._field[row][col] = path;
            return null;
        };
    }

    generateField(height, width, holePercentage) {
        /*
        Notes:
        * Initial path always at [0][0]
        * Hat never at [0][0]
        * Avoid no path to hat
        */

        const newField = [];

        // Patch field
        let patchedRow = [];
        for (let c = 0; c < width; c++) patchedRow.push(patch);
        for (let r = 0; r < height; r++) newField.push([...patchedRow]);

        // Add hat to field
        const hatRow = Math.floor(Math.random() * (height / 2) + (height / 2)).toString();
        const hatCol = Math.floor(Math.random() * (width / 2) + (width / 2)).toString();
        const hatIndex = hatRow + hatCol;
        newField[Number(hatRow)][Number(hatCol)] = hat;

        // Carve path to hat
        const pathIndices = this.generatePathtoHat(height, width, holePercentage, hatIndex);

        // Add holes to field
        const holesIndices = [];
        const totalHoles = Math.round((height * width * holePercentage) / 100);
        let holeCount = 0;

        while (holeCount < totalHoles) {
            let row = Math.floor(Math.random() * height).toString();
            let col = Math.floor(Math.random() * width).toString();
            let holeIndex = row + col;
            if (!holesIndices.includes(holeIndex) && !pathIndices.includes(holeIndex) && holeIndex !== hatIndex) {
                holesIndices.push(holeIndex);
                holeCount++;
            };
        };

        holesIndices.forEach((item) => {
            newField[Number(item[0])][Number(item[1])] = hole;
        });

        newField[0][0] = path; // Initialize path
        this._field = newField;
    }

    getNewFieldParams() {
        let rows = this.getRowsColsHoles('rows');
        let cols = this.getRowsColsHoles('columns');
        let holes = this.getRowsColsHoles('holes');
        return { rows, cols, holes };
    }

    getRowsColsHoles(attribute) {
        let valueValidated = false;

        while (valueValidated === false) {
            if (attribute !== 'holes') {
                const value = Number(prompt(`How many ${attribute}? Must be a number between 3-10. `));
                if (value !== 'NaN' && value >= 3 && value <= 10) {
                    valueValidated = true;
                    return value;
                } else {
                    console.log('Invalid input. Please try again.');
                };
            } else {
                const value = Number(prompt('What percentage of holes? Must be a number between 20-40. '));
                if (value !== 'NaN' && value >= 20 && value <= 40) {
                    valueValidated = true;
                    return value;
                } else {
                    console.log('Invalid input. Please try again.');
                };
            };
        };
    }

    generatePathtoHat(height, width, holePercentage, hatIndex) {
        const maxPathIndices = Math.round((height * width) * (100 - holePercentage) / 100 - 1);
        const adjacentHatIndices = [];
        let pathIndices = ['00'];
        let pathCarved = false;
        let pathCarvedValidated = false;

        // Store adjacent top, right, bottom, and left hat indices
        if (Number(hatIndex[0]) > 0) adjacentHatIndices.push(String(Number(hatIndex[0]) - 1) + hatIndex[1]);
        if (Number(hatIndex[1]) < width - 1) adjacentHatIndices.push(hatIndex[0] + String(Number(hatIndex[1]) + 1));
        if (Number(hatIndex[0]) < height - 1) adjacentHatIndices.push(String(Number(hatIndex[0]) + 1) + hatIndex[1]);
        if (Number(hatIndex[1]) > 0) adjacentHatIndices.push(hatIndex[0] + String(Number(hatIndex[1]) - 1));
        console.log(`adjacentHatIndices: ${adjacentHatIndices}`);

        // Generate a path to the hat
        while (!pathCarvedValidated) {
            let currentIndex = '00';
            let indexStack = [currentIndex];
            const visited = [currentIndex];

            while (!pathCarved) {
                const availablePaths = [];
                let pathRow = Number(currentIndex[0]);
                let pathCol = Number(currentIndex[1]);

                // Identify available paths
                if (pathRow > 0 && !visited.includes(String(pathRow - 1) + String(pathCol))) availablePaths.push('Up');
                if (pathRow < height - 1 && !visited.includes(String(pathRow + 1) + String(pathCol))) availablePaths.push('Down');
                if (pathCol > 0 && !visited.includes(String(pathRow) + String(pathCol - 1))) availablePaths.push('Left');
                if (pathCol < width - 1 && !visited.includes(String(pathRow) + String(pathCol + 1))) availablePaths.push('Right');

                // Select random path
                if (availablePaths.length > 0) {
                    const pathMoveIndex = Math.floor(Math.random() * availablePaths.length);

                    if (availablePaths[pathMoveIndex] === 'Up') currentIndex = String(--pathRow) + String(pathCol);
                    else if (availablePaths[pathMoveIndex] === 'Down') currentIndex = String(++pathRow) + String(pathCol);
                    else if (availablePaths[pathMoveIndex] === 'Left') currentIndex = String(pathRow) + String(--pathCol);
                    else currentIndex = String(pathRow) + String(++pathCol);

                    pathIndices.push(currentIndex);
                    visited.push(currentIndex);
                    indexStack.push(currentIndex);

                    // Check if new path index is adjacent to hat index
                    for (let i = 0; i < adjacentHatIndices.length; i++) {
                        if (currentIndex === adjacentHatIndices[i]) pathCarved = true;
                    };
                } else {
                    pathIndices.pop();
                    indexStack.pop();
                    currentIndex = indexStack.slice(-1)[0];
                    pathRow = Number(currentIndex[0]);
                    pathCol = Number(currentIndex[1]);
                };
            };
    
            // Confirm path does not exceed hole percentage, reset path if it does
            if (pathIndices.length <= maxPathIndices) pathCarvedValidated = true;
            else pathIndices = ['00'];
        };

        return pathIndices;
    }

    printField() {
        const field = this._field.map(item => {
            return item.join('');
        });
        console.log(field.join('\n'));
    }
};

const field = [
    [path, patch, hole],
    [patch, hole, patch],
    [patch, hat, patch]
];

const game = new Field(field);
let gameStatus = 'active';
let colIndex = 0;
let rowIndex = 0;

while (gameStatus != 'gameover') {
    game.printField();

    const direction = prompt('Move Up (u), Down (d), Left (l), or Right (r)?');

    if (direction === 'u') gameStatus = game.checkGameStatus(game.evaluateMove(--rowIndex, colIndex));
    else if (direction === 'd') gameStatus = game.checkGameStatus(game.evaluateMove(++rowIndex, colIndex));
    else if (direction === 'l') gameStatus = game.checkGameStatus(game.evaluateMove(rowIndex, --colIndex));
    else if (direction === 'r') gameStatus = game.checkGameStatus(game.evaluateMove(rowIndex, ++colIndex));
    else console.log('Invalid input');

    if (gameStatus === 'reset') colIndex = 0, rowIndex = 0;
};
