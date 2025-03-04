async function getRandomPokemon(count = 10) {
    const pokemonList = [];

    const pokemonCountResponse = await fetch(`https://pokeapi.co/api/v2/pokemon`);
    const pokemonCountData = await pokemonCountResponse.json();
    const pokemonCount = pokemonCountData.count;

    for (let i = 0; i < count; i++) {
        const randomId = Math.floor(Math.random() * pokemonCount) + 1;
        const randomPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const randomPokemonData = await randomPokemonResponse.json();
        if (randomPokemonData) {
            pokemonList.push({
                id: randomPokemonData.id,
                name: randomPokemonData.name,
                image: randomPokemonData.sprites.front_default
            });
        } else {
            i--;
        }
    }

    getPokemonEvolution(pokemonList);

    return pokemonList;
}

async function getPokemonEvolution(pokemonList) {
    const pokemonEvolutionList = [];

    for (const pokemon of pokemonList) {
        const pokemonEvolutionResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
        const pokemonEvolutionData = await pokemonEvolutionResponse.json();
        pokemonEvolutionList.push({
            id: pokemonEvolutionData.id,
            name: pokemonEvolutionData.name,
            image: pokemonEvolutionData.sprites.front_default
        });
    }

    return pokemonEvolutionList;
}

getRandomPokemon();
