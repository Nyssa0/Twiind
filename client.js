import { displayPokemons } from "./script.js";
const socket = io();
let currentRoom = null;
let playersReady = 0;

document.getElementById('createRoom').addEventListener('click', () => {
    socket.emit('createRoom');
});

socket.on('roomCreated', (roomId) => {
    currentRoom = roomId;
    document.getElementById('message').innerText = `Room created : ${roomId}`;
    document.getElementById('leaveRoom').disabled = false;
});

document.getElementById('joinRoom').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value;
    if (roomId && !currentRoom) {
        socket.emit('joinRoom', roomId);
    } else {
        document.getElementById('message').innerText = 'Leave the current room first.';
    }
});

socket.on('playerJoined', (playerId, roomId, playerCount) => {
    currentRoom = roomId;
    document.getElementById('message').innerText = `The player ${playerId} joined`;
    document.getElementById('leaveRoom').disabled = false;

    if (playerCount === 2) {
        document.getElementById('startGame').disabled = false;
    }
});

document.getElementById('leaveRoom').addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('leaveRoom');
        currentRoom = null;
        document.getElementById('message').innerText = 'You left the room.';
        document.getElementById('leaveRoom').disabled = true;
        document.getElementById('startGame').disabled = true;
    }
});

socket.on('playerLeft', (playerId) => {
    document.getElementById('message').innerText = `${playerId} left.`;
    document.getElementById('startGame').disabled = true;
    playersReady = 0;
});

document.getElementById('startGame').addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('playerReady', currentRoom);
    }
});

socket.on('updateReadyCount', (readyCount) => {
    playersReady = readyCount;
    document.getElementById('message').innerText = `Ready players : ${playersReady}/2`;

    if (playersReady === 2) {
        socket.emit('startGame', currentRoom);
    }
});

socket.on('gameStarted', () => {
    document.getElementById('message').innerText = 'The game starts ! 🚀';
    document.getElementById('startGame').disabled = true;
});

socket.on("gameStarted", (role) => {
    fetch("/api/pokemons")
        .then(response => response.json())
        .then(({ randomPokemons, evolvedPokemons }) => {
            console.log(randomPokemons)
            console.log(evolvedPokemons)
            if (role === "random") {
                displayPokemons(randomPokemons);
            } else {
                displayPokemons(evolvedPokemons);
            }
        })
        .catch(error => console.error("Error while loading the pokemons :", error));
});


socket.on('error', (msg) => {
    document.getElementById('message').innerText = msg;
});