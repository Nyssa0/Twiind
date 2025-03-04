const socket = io();

document.getElementById('createRoom').addEventListener('click', () => {
    socket.emit('createRoom');
});

socket.on('roomCreated', (roomId) => {
    document.getElementById('message').innerText = `Room créée : ${roomId}`;
});

document.getElementById('joinRoom').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value;
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
});

socket.on('playerJoined', (playerId) => {
    document.getElementById('message').innerText = `Un joueur a rejoint : ${playerId}`;
});

socket.on('error', (msg) => {
    document.getElementById('message').innerText = msg;
});
