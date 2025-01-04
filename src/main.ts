// src/main.ts

import { Game } from './Game';

let gameInstance: Game | null = null; // Keep a reference to the game instance

async function getGameInstance(loadPath?: string) {
    // Create a new Game instance
    console.log("Request creating new game...");
    gameInstance = new Game(loadPath);

    await gameInstance.ready();

    return gameInstance;
}

async function onStartButtonClick() {
    // Hide the main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }

    // Hide the cursor
    document.body.style.cursor = 'none';

    // Initialize the game
    const game = await getGameInstance();

    game.start();

    // Stop background music if needed
    stopBackgroundMusic();

    // Remove global event listeners to prevent further unmuting
    document.removeEventListener('click', unmuteAudio);
    document.removeEventListener('keydown', unmuteAudio);
    document.removeEventListener('touchstart', unmuteAudio);
}

async function createRoom() {
    const game = await getGameInstance();
    let data = await fetch('./create_room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: game.userId
        })
    }).then(response => response.json());
    let room_id = data.room_id;
    game.connectToRoom(room_id);
}

async function joinRoom(roomId: string) {
    const game = await getGameInstance();
    let data = await fetch(`./join_room`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: game.userId,
            room_id: roomId
        })
    }).then(response => response.json())
    let room_id = data.room_id;
    game.connectToRoom(room_id);
}

async function backToMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }
    const roomList = document.getElementById('room-selection');
    if (roomList) {
        roomList.style.display = 'none';
    }
}

async function onStartOnlineButtonClick() {
    // Hide the main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }
    const roomList = document.getElementById('room-selection');
    if (roomList) {
        roomList.style.display = 'flex';
    }

    // // Stop background music if needed
    // stopBackgroundMusic();

    // // Remove global event listeners to prevent further unmuting
    // document.removeEventListener('click', unmuteAudio);
    // document.removeEventListener('keydown', unmuteAudio);
    // document.removeEventListener('touchstart', unmuteAudio);
}

function onMainMenuButtonClick(): void {
    // Hide the mission failed screen
    const missionFailedScreen = document.getElementById('mission-failed-screen');
    if (missionFailedScreen) {
        missionFailedScreen.style.display = 'none';
    }

    // Show the main menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }

    // Dispose of the game instance
    if (gameInstance) {
        gameInstance.dispose();
        gameInstance = null;
    }

    // Ensure cursor is visible
    document.body.style.cursor = 'default';

    // // Play background music again
    // playBackgroundMusic();

    // // Re-add global event listeners to unmute audio
    // document.addEventListener('click', unmuteAudio, { once: true });
    // document.addEventListener('keydown', unmuteAudio, { once: true });
    // document.addEventListener('touchstart', unmuteAudio, { once: true });
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

function init(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.has('replay')) {
        const roomUUID = params.get('replay');
        getGameInstance();
    } else {
        // Add event listener to the Start Game button
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                onStartButtonClick();
            });
        }

        const onlineButton = document.getElementById('start-online-button');
        if (onlineButton) {
            onlineButton.addEventListener('click', () => {
                onStartOnlineButtonClick();
            });
        }

        const createRoomButton = document.getElementById('create-room-button');
        const joinRoomButton = document.getElementById('join-room-button');
        const backToMainMenuButton = document.getElementById('back-to-main-menu-button');
        if (createRoomButton) {
            createRoomButton.addEventListener('click', () => {
                createRoom();
            });
        }
        if (joinRoomButton) {
            joinRoomButton.addEventListener('click', () => {
                let roomId = (document.getElementById('room-id-input') as HTMLInputElement).value;
                joinRoom(roomId);
            });
        }
        if (backToMainMenuButton) {
            backToMainMenuButton.addEventListener('click', () => {
                backToMainMenu();
            });
        }
    }

    // Play background music in muted state
    playBackgroundMusic();

    // Add a global event listener to unmute audio on any user interaction
    document.addEventListener('click', unmuteAudio, { once: true });
    document.addEventListener('keydown', unmuteAudio, { once: true });
    document.addEventListener('touchstart', unmuteAudio, { once: true });

    // Add event listener to the Main Menu button in mission failed screen
    const mainMenuButton = document.getElementById('main-menu-button');
    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', () => {
            // onMainMenuButtonClick();
            window.location.href = "index.html";
        });
    }
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
