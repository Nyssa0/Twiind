const socket = io();
let currentRoom = null;
let playersReady = 0;

document.getElementById('createRoom').addEventListener('click', () => {
    socket.emit('createRoom');
});

socket.on('roomCreated', (roomId) => {
    currentRoom = roomId;
    document.getElementById('message').innerText = `Room créée : ${roomId}`;
    document.getElementById('leaveRoom').disabled = false;
});

document.getElementById('joinRoom').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value;
    if (roomId && !currentRoom) {
        socket.emit('joinRoom', roomId);
    } else {
        document.getElementById('message').innerText = 'Quittez d\'abord votre room actuelle.';
    }
});

socket.on('playerJoined', (playerId, roomId, playerCount) => {
    currentRoom = roomId;
    document.getElementById('message').innerText = `Un joueur a rejoint : ${playerId}`;
    document.getElementById('leaveRoom').disabled = false;

    if (playerCount === 2) {
        document.getElementById('startGame').disabled = false;
    }
});

document.getElementById('leaveRoom').addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('leaveRoom');
        currentRoom = null;
        document.getElementById('message').innerText = 'Vous avez quitté la room.';
        document.getElementById('leaveRoom').disabled = true;
        document.getElementById('startGame').disabled = true;
    }
});

socket.on('playerLeft', (playerId) => {
    document.getElementById('message').innerText = `Un joueur a quitté : ${playerId}`;
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
    document.getElementById('message').innerText = `Joueurs prêts : ${playersReady}/2`;

    if (playersReady === 2) {
        socket.emit('startGame', currentRoom);
    }
});

socket.on('gameStarted', () => {
    document.getElementById('message').innerText = 'La partie commence ! 🚀';
    document.getElementById('startGame').disabled = true;
});

socket.on('error', (msg) => {
    document.getElementById('message').innerText = msg;
});