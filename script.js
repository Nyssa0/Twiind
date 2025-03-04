async function displayPokemons() {
    const randomPokemonContainer = document.querySelector(".randomPokemons");
    const evolvedPokemonContainer = document.querySelector(".evolvedPokemons");

    try {
        const response = await fetch("http://localhost:3000/api/pokemons");
        if (!response.ok) throw new Error("Failed to fetch Pokémon data");

        const data = await response.json();
        const { randomPokemons, evolvedPokemons } = data;

        randomPokemonContainer.innerHTML = "";
        evolvedPokemonContainer.innerHTML = "";

        randomPokemons.forEach((randomPokemon) => {
            const pokemonElement = document.createElement("div");
            pokemonElement.classList.add("pokemon-card");
            pokemonElement.innerHTML = `
                <img src="${randomPokemon.image}" alt="${randomPokemon.name}">
                <p>${randomPokemon.name}</p>
            `;
            randomPokemonContainer.appendChild(pokemonElement);
        });

        evolvedPokemons.forEach((evolvedPokemon) => {
            const pokemonElement = document.createElement("div");
            pokemonElement.classList.add("pokemon-card");
            pokemonElement.innerHTML = `
                <img src="${evolvedPokemon.image}" alt="${evolvedPokemon.name}">
                <p>${evolvedPokemon.name}</p>
            `;
            evolvedPokemonContainer.appendChild(pokemonElement);
        });
    } catch (error) {
        console.error("Error while displaying pokemons:", error);
    }
}

document.addEventListener("DOMContentLoaded", displayPokemons);