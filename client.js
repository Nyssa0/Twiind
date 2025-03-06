// import { displayPokemons } from "./script.js";
const socket = io();
let currentRoom = null;
let playersReady = 0;
let isMyTurn = false;
let hasChosenCard = false;
let canSendHint = true;
let gameIsEnded = false;

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

socket.on("gameStarted", (role) => {
    fetch("/api/pokemons")
        .then(response => response.json())
        .then(({ randomPokemons, evolvedPokemons }) => {
            if (role === "random") {
                displayPokemons(randomPokemons);
            } else {
                displayPokemons(evolvedPokemons);
            }
        })
        .catch(error => console.error("Erreur lors du chargement des Pokémon :", error));
});

socket.on('gameEnded', () => {
    document.getElementById('message').innerText = 'The game is over !🔚 You won !🎉 Would you like to play again ?';
    document.getElementById('startGame').disabled = false;
    document.querySelector(".turn__counter").style.display = "none";
    document.querySelector(".randomPokemons").innerHTML = "";
    document.querySelector("#turn").innerHTML = "";
});

socket.on('yourTurn', (turn) => {
    isMyTurn = turn;
    if (isMyTurn) {
        document.getElementById('turn').innerText = "C'est à vous de jouer !";
        document.querySelector("#hint-timer").innerHTML = '';
    } else {
        document.getElementById('turn').innerText = "Attendez votre tour...";
        document.getElementById("received-hints").innerHTML = '';
    }

    if (isMyTurn || !hasChosenCard) {
        document.getElementById('hints-container').classList.add('hidden');
    } else {
        document.getElementById('hints-container').classList.remove('hidden');
    }
});


socket.on('error', (msg) => {
    document.getElementById('message').innerText = msg;
});


function getBackgroundClass(type) {
    const typeClasses = {
        electric: "yellow",
        fire: "redorange",
        water: "blue",
        grass: "green",
        poison: "purple",
        bug: "lightgreen",
        normal: "grey",
        fairy: "pink",
        fighting: "brown",
        ghost: "darkpurple",
        ground: "lightbrown",
        psychic: "lightpurple",
    };

    return typeClasses[type] || "default";
}

export async function displayPokemons(pokemons) {
    const randomPokemonContainer = document.querySelector(".randomPokemons");

    for (const randomPokemon of pokemons) {
        const pokemonElement = document.createElement("li");
        pokemonElement.classList.add("pokemon__card");
        const backgroundClass = getBackgroundClass(randomPokemon.type);

        const tcgCard = await getTcgCard(randomPokemon.name)

        if (tcgCard) {
            pokemonElement.innerHTML = `
                <div class="pokemon__card-inner">
                    <div class="pokemon__background pokemon__background--${backgroundClass}">
                        <img src="${tcgCard}" class="tcg-card" alt="${randomPokemon.name}">
                    </div>
                    <img class="pokemon__back is-hidden" src="/assets/back-pokemon-card.png" alt="pokemon card back">
                </div>
            `;
        } else {
            pokemonElement.innerHTML = `
                <div class="pokemon__card-inner">
                    <div class="pokemon__background pokemon__background--${backgroundClass} --not-tcg">
                        <table class="pokemon__header">
                            <tr>
                                <td class="basic" colspan="3">Basic Pokémon</td>
                            </tr>
                            <tr>
                                <td class="pokemon__name">${randomPokemon.name} ${randomPokemon.type}</td>
                                <td class="pokemon__hp">${randomPokemon.hp} HP</td>
                                <td class="typesign"> ☻ </td>
                            </tr>
                        </table>
                        <img class="pokemon__image" src="${randomPokemon.image}" alt="${randomPokemon.name}">
                        <br>
                        <div class="pokemon__info">
                            <p class="pokemon__description">This is a pokemon description.</p>
                            <table class="pokemon__stats">
                                <tr>
                                    <td class="pokemon__energy">☻</td>
                                    <td class="pokemon__attack_description pokemon__attack_description--center"><span class="label">Gnaw</span></td>
                                    <td class="pokemon__damage">10</td>
                                </tr>
                            </table>
                            <table class="pokemon__stats">
                                <tr>
                                    <td class="pokemon__energy">☻ ☻</td>
                                    <td class="pokemon__attack_description"><span class="label">Thundershock</span> <span class="labeltext">Flip a coin. If tails, ${randomPokemon.name} does 10 damage to itself.</span></td>
                                    <td class="pokemon__damage">20</td>
                                </tr>
                            </table>
                            <table class="pokemon__costs">
                                <tr class="pokemon__cost_headers">
                                    <td>weakness</td>
                                    <td>resistance</td>
                                    <td>retreat cost</td>
                                </tr>
                                <tr class="pokemon__cost_icons">
                                    <td>☻</td>
                                    <td></td>
                                    <td>☻</td>
                                </tr>
                            </table>
                            <ul>
                                <li class="italicize">I'm writing about pokemons.</li>
                                <li class="pokemon__copyrights"><br><span class="strong">Illus Mitsuhiro Arita</strong>  <span class="medium">©1995, 96, 98 Nintendo Creatures, GAMEFREAK ©1999 Wizards</span> <span class="strong">58/102 ●</strong></li>       
                            </ul>
                        </div>
                    </div>
                    <img class="pokemon__back is-hidden" src="/assets/back-pokemon-card.png" alt="pokemon card back">
                </div>
            `;

        }
        randomPokemonContainer.appendChild(pokemonElement);
    }

    shuffleCards();

    setTimeout(() => {
        viewCards(false);

        document.querySelectorAll(".randomPokemons .pokemon__card").forEach((card, index) => {
            card.addEventListener("click", () => {
                if (!isMyTurn) {
                    document.getElementById('message').innerText = "Ce n'est pas votre tour !";
                    return;
                } else {
                    deactivateCard(index);
                }
                if (hasChosenCard) {
                    document.getElementById('message').innerText = "Vous avez déjà choisi une carte !";
                    return;
                }
            });
        });

        turnCounter();
    }, 10000);
}

function shuffleCards() {
    const cards = document.querySelectorAll(".pokemon__card");
    cards.forEach((card) => {
        card.style.order = Math.floor(Math.random() * cards.length);
    });
}

function viewCards(isVisible) {
    isVisible ? document.body.classList.add("disabled") : document.body.classList.remove("disabled");
    const cards = document.querySelectorAll(".pokemon__card");

    cards.forEach((card) => {
        if (!card.classList.contains("disabled")) {
            card.classList.toggle("is-hidden");
        }
    });

    if (isVisible === true) {
        setTimeout(() => {
            viewCards(false);
            turnCounter();
        }, 10000);
    }
}

function deactivateCard(index) {
    if (!isMyTurn || hasChosenCard) return;

    const selectedCard = document.querySelectorAll(".randomPokemons .pokemon__card")[index];
    selectedCard.classList.remove("is-hidden");

    hasChosenCard = true;
    socket.emit('cardChoice', index);
}

document.getElementById('send-hint').addEventListener("click", () => {
    const type = document.getElementById('hint-type').value;
    const generation = document.getElementById('hint-generation').value;
    const status = document.getElementById('hint-status').value;
    const stage = document.getElementById('hint-stage').value;

    const hint = { type, generation, status, stage };

    socket.emit('sendHint', hint);

    canSendHint = false;
    document.getElementById('send-hint').disabled = true;
    startHintCooldown();
});

function startHintCooldown() {
    let timeLeft = 10;

    const countdownInterval = setInterval(() => {
        timeLeft--;
        document.querySelector("#hint-timer").innerHTML = timeLeft;

        if (timeLeft === 0) {
            clearInterval(countdownInterval);
            document.querySelector("#hint-timer").innerHTML = 'Vous pouvez envoyer un indice !';
            canSendHint = true;
            document.getElementById('send-hint').disabled = false;
            document.getElementById('hint-timer').classList.remove('hidden');
        }
    }, 1000);
}

socket.on('receiveHint', (hint) => {
    let hintText = "Indice : ";
    if (hint.type) hintText += `Type : ${hint.type}, `;
    if (hint.generation) hintText += `Génération : ${hint.generation}, `;
    if (hint.status) hintText += `Statut : ${hint.status}, `;
    if (hint.stage) hintText += `Stade évolutif : ${hint.stage}`;

    document.getElementById("received-hints").innerHTML = `
        <h3>${hintText}</h3>
    `;
});

socket.on('goodMatch', (index, firstCardIndex) => {
    if (checkEndGame() !== true) {
        document.getElementById('message').innerText = `Good match !`;
        document.querySelectorAll(".randomPokemons .pokemon__card")[index].classList.remove("is-hidden");

        setTimeout(() => {
            if (!isMyTurn) {
                document.querySelectorAll(".randomPokemons .pokemon__card")[firstCardIndex].classList.add("disabled");
            } else {
                document.querySelectorAll(".randomPokemons .pokemon__card")[index].classList.add("disabled");
            }
        }, 1000);

        hasChosenCard = false;

        checkEndGame();
    }
});

socket.on('badMatch', (index) => {
    document.getElementById('message').innerText = `Bad match !`;

    setTimeout(() => {
        document.querySelectorAll(".randomPokemons .pokemon__card")[index].classList.add("is-hidden");
    }, 1000);

    hasChosenCard = false;
});

function turnCounter() {
    let counter = 20;
    const interval = setInterval(() => {
        document.querySelector(".turn__counter").innerHTML = counter;
        counter--;

        if (counter === 0) {
            clearInterval(interval);
            document.querySelector(".turn__counter").innerHTML = 0;
            shuffleCards();
            viewCards(true);
        }
    }, 1000);
}

async function getTcgCard(pokemonName) {
    const API_KEY = "75c31550-d6c3-49fa-98fc-98205889e850";

    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${pokemonName}`, {
            headers: {
                "X-Api-Key": API_KEY
            }
        });

        if (!response.ok) throw new Error("TCG card not found");

        const data = await response.json();

        const filteredCards = data.data.filter(card => !card.subtypes.includes("TAG TEAM"));

        if (filteredCards.length === 0) throw new Error("No valid cards found");

        let randomCard = Math.floor(Math.random() * filteredCards.length);
        return filteredCards[randomCard].images.large;

    } catch (error) {
        console.error("Error while searching TCG card:", error);
    }
}

function checkEndGame() {
    const hiddenCards = document.querySelectorAll(".randomPokemons .pokemon__card.is-hidden");

    if (hiddenCards.length === 0) {
        setTimeout(() => {
            socket.emit('gameEnded', true);
            return gameIsEnded = true;
        }, 5000);
    }
}
