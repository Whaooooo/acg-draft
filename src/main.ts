// src/main.ts

import { Game } from './Game';

function init(): void {
    // Determine the loadPath, e.g., from user input or saved data
    const loadPath = getLoadPathFromUser(); // Implement this function as needed

    // Create a new Game instance
    console.log("Request creating new game...")
    const game = new Game(loadPath);
}

function getLoadPathFromUser() : string {
    return ''
}

init();
