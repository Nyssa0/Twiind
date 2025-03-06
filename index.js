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
let selectedIndexes = [];
const playerTurns = new Map();
const firstCard = new Map();

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

            playerTurns.set(roomId, players[0]); // Le premier joueur commence
            firstCard.set(roomId, null);
            io.to(players[0]).emit('yourTurn', true);
            io.to(players[1]).emit('yourTurn', false);

            io.to(players[0]).emit('gameStarted', 'random');
            io.to(players[1]).emit('gameStarted', 'evolved');


            readyPlayers.set(roomId, new Set());
        }
    });


    socket.on('cardChoice', (cardChoice) => {
        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        if (socket.id !== playerTurns.get(roomId)) {
            socket.emit('error', 'Ce n\'est pas votre tour');
            return;
        }

        const players = roomPlayers.get(roomId);
        const opponent = players.find((p) => p !== socket.id);

        if (!firstCard.get(roomId)) {
            // Premier joueur choisit une carte
            firstCard.set(roomId, { socketId: socket.id, index: cardChoice });

            // On passe la main à l'autre joueur
            playerTurns.set(roomId, opponent);
            io.to(socket.id).emit('yourTurn', false);
            io.to(opponent).emit('yourTurn', true);
            return;
        }

        // Second joueur choisit
        const firstChoice = firstCard.get(roomId);
        if (firstChoice.index === cardChoice) {
            io.to(roomId).emit('goodMatch', cardChoice, firstChoice.index);

            // Réinitialisation et inversion des rôles
            firstCard.set(roomId, null);
            playerTurns.set(roomId, socket.id); // Le joueur qui a trouvé devient le "premier joueur"

            io.to(socket.id).emit('yourTurn', true);
            io.to(opponent).emit('yourTurn', false);
        } else {
            io.to(roomId).emit('badMatch', cardChoice);
            // le joueur actuel continue jusqu'à ce qu'il trouve une paire
        }
    });

    socket.on('sendHint', (hint) => {
        const roomId = userRooms.get(socket.id);
        if (!roomId) return;

        const players = roomPlayers.get(roomId);
        const opponent = players.find((p) => p !== socket.id);

        if (playerTurns.get(roomId) !== opponent) {
            socket.emit('error', "Vous ne pouvez envoyer des indices que lorsque vous attendez.");
            return;
        }

        io.to(opponent).emit('receiveHint', hint);
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
