const socket = io();
let currentRoom = null;

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

socket.on('playerJoined', (playerId, roomId) => {
    currentRoom = roomId;
    document.getElementById('message').innerText = `Un joueur a rejoint : ${playerId}`;
    document.getElementById('leaveRoom').disabled = false;
});

document.getElementById('leaveRoom').addEventListener('click', () => {
    console.log(currentRoom)
    if (currentRoom) {
        socket.emit('leaveRoom');
        currentRoom = null;
        document.getElementById('message').innerText = 'Vous avez quitté la room.';
        document.getElementById('leaveRoom').disabled = true;
    }
});

socket.on('playerLeft', (playerId) => {
    document.getElementById('message').innerText = `Un joueur a quitté : ${playerId}`;
});

socket.on('error', (msg) => {
    document.getElementById('message').innerText = msg;
});