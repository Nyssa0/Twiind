import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(process.cwd())));

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

const userRooms = new Map();

io.on('connection', (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    socket.on('createRoom', () => {
        if (userRooms.has(socket.id)) {
            socket.emit('error', 'Vous devez d\'abord quitter votre room actuelle.');
            return;
        }

        const roomId = Math.random().toString(36).substr(2, 6);
        socket.join(roomId);
        userRooms.set(socket.id, roomId);
        console.log(`Room créée : ${roomId}`);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (userRooms.has(socket.id)) {
            socket.emit('error', 'Vous devez d\'abord quitter votre room actuelle.');
            return;
        }

        const rooms = io.sockets.adapter.rooms;
        if (rooms.has(roomId)) {
            socket.join(roomId);
            userRooms.set(socket.id, roomId);
            console.log(`Joueur ${socket.id} a rejoint la room ${roomId}`);
            io.to(roomId).emit('playerJoined', socket.id, roomId);
        } else {
            socket.emit('error', 'Room inexistante');
        }
    });

    socket.on('leaveRoom', () => {
        const roomId = userRooms.get(socket.id);
        if (roomId) {
            socket.leave(roomId);
            userRooms.delete(socket.id);
            console.log(`Joueur ${socket.id} a quitté la room ${roomId}`);
            io.to(roomId).emit('playerLeft', socket.id);
        }
    });

    socket.on('disconnect', () => {
        const roomId = userRooms.get(socket.id);
        if (roomId) {
            userRooms.delete(socket.id);
            io.to(roomId).emit('playerLeft', socket.id);
        }
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});