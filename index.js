import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(process.cwd())));

// Route pour servir `index.html` par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

io.on('connection', (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substr(2, 6);
        socket.join(roomId);
        console.log(`Room créée : ${roomId}`);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        const rooms = io.sockets.adapter.rooms;
        if (rooms.has(roomId)) {
            socket.join(roomId);
            console.log(`Joueur ${socket.id} a rejoint la room ${roomId}`);
            io.to(roomId).emit('playerJoined', socket.id);
        } else {
            socket.emit('error', 'Room inexistante');
        }
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});