import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { getRandomPokemons, getEvolvedPokemons } from "./pokemon.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);
const userRooms = new Map();
const roomPlayers = new Map();
const readyPlayers = new Map();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

let cachedPokemons = null;

app.get("/api/pokemons", async (req, res) => {
    try {
        if (!cachedPokemons) {
            const randomPokemons = await getRandomPokemons();
            const evolvedPokemons = await getEvolvedPokemons(randomPokemons);
            cachedPokemons = { randomPokemons, evolvedPokemons };
        }

        res.json(cachedPokemons);
    } catch (error) {
        res.status(500).json({ error: "Error while getting the pokemons." });
    }
});

// Endpoint pour réinitialiser les Pokémon
app.post("/api/reset-pokemons", async (req, res) => {
    try {
        const randomPokemons = await getRandomPokemons();
        const evolvedPokemons = await getEvolvedPokemons(randomPokemons);
        cachedPokemons = { randomPokemons, evolvedPokemons };
        res.json({ message: "Pokémon list reset!" });
    } catch (error) {
        res.status(500).json({ error: "Error while resetting the pokemons." });
    }
});

io.on('connection', (socket) => {
    console.log(`New connection : ${socket.id}`);

    socket.on('createRoom', () => {
        if (userRooms.has(socket.id)) {
            socket.emit('error', 'Leave the current room first.');
            return;
        }

        const roomId = Math.random().toString(36).substr(2, 6);
        socket.join(roomId);
        userRooms.set(socket.id, roomId);
        roomPlayers.set(roomId, [socket.id]);
        readyPlayers.set(roomId, new Set());
        console.log(`Room created : ${roomId}`);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (userRooms.has(socket.id)) {
            socket.emit('error', 'Leave the current room first.');
            return;
        }

        const players = roomPlayers.get(roomId) || [];

        if (players.length >= 2) {
            socket.emit('error', 'The room is full. Impossible to join.');
            return;
        }

        const rooms = io.sockets.adapter.rooms;
        if (rooms.has(roomId)) {
            socket.join(roomId);
            userRooms.set(socket.id, roomId);
            roomPlayers.get(roomId).push(socket.id);
            console.log(`Player ${socket.id} joined the room ${roomId}`);

            const playerCount = roomPlayers.get(roomId).length;
            io.to(roomId).emit('playerJoined', socket.id, roomId, playerCount);
        } else {
            socket.emit('error', 'Non existing room.');
        }
    });

    socket.on('leaveRoom', () => {
        const roomId = userRooms.get(socket.id);
        if (roomId) {
            socket.leave(roomId);
            userRooms.delete(socket.id);

            const players = roomPlayers.get(roomId).filter(id => id !== socket.id);
            roomPlayers.set(roomId, players);

            io.to(roomId).emit('playerLeft', socket.id);
            readyPlayers.get(roomId)?.delete(socket.id);
        }
    });

    socket.on('playerReady', () => {
        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const readySet = readyPlayers.get(roomId);
        if (!readySet) return;

        readySet.add(socket.id);

        io.to(roomId).emit('updateReadyCount', readySet.size);

        if (readySet.size === 2) {
            const players = [...readySet];
            const roles = {
                [players[0]]: 'random',
                [players[1]]: 'evolved'
            };

            io.to(players[0]).emit('gameStarted', 'random');
            io.to(players[1]).emit('gameStarted', 'evolved');

            readyPlayers.set(roomId, new Set());
        }
    });

    socket.on('disconnect', () => {
        const roomId = userRooms.get(socket.id);
        if (roomId) {
            userRooms.delete(socket.id);
            roomPlayers.set(roomId, roomPlayers.get(roomId).filter(id => id !== socket.id));
            readyPlayers.get(roomId)?.delete(socket.id);
            io.to(roomId).emit('playerLeft', socket.id);
        }
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
