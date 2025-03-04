import express from 'express';
import { createServer } from 'node:http';
import { getRandomPokemons, getEvolvedPokemons } from "./pokemon.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get("/api/pokemons", async (req, res) => {
    try {
        const randomPokemons = await getRandomPokemons();
        const evolvedPokemons = await getEvolvedPokemons(randomPokemons);
        res.json({randomPokemons, evolvedPokemons});
    } catch (error) {
        res.status(500).json({ error: "Error while getting the pokemons." });
    }
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});