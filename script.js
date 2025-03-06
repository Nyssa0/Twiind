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
        console.log(tcgCard);

        if (tcgCard) {
            pokemonElement.innerHTML = `
               <img src="${tcgCard}" alt="${randomPokemon.name}">
            `
        } else {
            pokemonElement.innerHTML = `
                <div class="pokemon__background pokemon__background--${backgroundClass}">
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
                    <img src="${randomPokemon.image}" alt="${randomPokemon.name}">
                    <br>
                    <div class="pokemon__info">
                        <p class="pokemon__description">This is a pokemon description.</p>
                        <table class="pokemon__stats">
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
