// src/main.ts

import { Game } from './Game';
// import './styles.css'; // Removed since styles are handled via <link> in index.html

function initGame(loadPath?: string): void {
    // Create a new Game instance
    console.log("Request creating new game...");
    const game = new Game(loadPath);
}

function onStartButtonClick(): void {
    // Hide the main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }

    // Initialize the game
    initGame();

    // Stop background music if needed
    stopBackgroundMusic();

    // Optionally, start game-specific music
    // startGameMusic();

    // Remove global event listeners to prevent further unmuting
    document.removeEventListener('click', unmuteAudio);
    document.removeEventListener('keydown', unmuteAudio);
    document.removeEventListener('touchstart', unmuteAudio);
}


let backgroundMusic: HTMLAudioElement | null = null;

function playBackgroundMusic(): void {
    const audioElement = document.getElementById('bgm') as HTMLAudioElement;
    if (audioElement) {
        backgroundMusic = audioElement;
        // Attempt to play the muted audio
        audioElement.play().catch((error) => {
            console.error('Failed to play background music:', error);
        });
    }
}

function stopBackgroundMusic(): void {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

function startGameMusic(): void {
    if (backgroundMusic) {
        backgroundMusic.muted = false; // Unmute the audio
        backgroundMusic.play().catch((error) => {
            console.error('Failed to play background music:', error);
        });
    }
}

function init(): void {
    // Add event listener to the Start Game button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', () => {
            onStartButtonClick();
            // Play game-specific music if desired
            // startGameMusic();
        });
    }

    // Play background music in muted state
    playBackgroundMusic();

    // Add a global event listener to unmute audio on any user interaction
    document.addEventListener('click', unmuteAudio, { once: true });
    document.addEventListener('keydown', unmuteAudio, { once: true });
    document.addEventListener('touchstart', unmuteAudio, { once: true });
}

function unmuteAudio(): void {
    if (backgroundMusic && backgroundMusic.muted) {
        backgroundMusic.muted = false;
        // Only play if the music is not paused
        if (!backgroundMusic.paused) {
            backgroundMusic.play().catch((error) => {
                console.error('Failed to unmute background music:', error);
            });
        }
    }
}

init();
