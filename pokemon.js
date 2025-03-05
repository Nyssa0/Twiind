export async function getRandomPokemons(count = 9) {
    const pokemonList = [];
    const pokemonCount = 100;

    const promises = Array.from({ length: count }, async () => {
        const randomId = Math.floor(Math.random() * pokemonCount) + 1;
        try {
            const randomPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            if (!randomPokemonResponse.ok) throw new Error(`Pokemon ${randomId} not found`);
            const randomPokemonData = await randomPokemonResponse.json();
            return {
                id: randomPokemonData.id,
                name: randomPokemonData.name,
                image: randomPokemonData.sprites.front_default,
                hp: randomPokemonData.stats[0].base_stat,
                type: randomPokemonData.types[0].type.name
            };
        } catch (error) {
            console.error(`Error while searching pokemon ${randomId}:`, error);
        }
    });

    const randomPokemons = await Promise.all(promises);
    pokemonList.push(...randomPokemons);

    await getEvolvedPokemons(pokemonList);

    return pokemonList;
}

export async function getEvolvedPokemons(pokemonList) {
    const pokemonEvolutionList = [];

    for (const pokemon of pokemonList) {
        try {
            const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
            if (!speciesResponse.ok) throw new Error(`Specie not found for ${pokemon.name}`);
            const speciesData = await speciesResponse.json();

            const evolutionChainUrl = speciesData.evolution_chain.url;
            const evolutionResponse = await fetch(evolutionChainUrl);
            const evolutionData = await evolutionResponse.json();

            let evolvedPokemon = null;
            let currentStage = evolutionData.chain;

            if(currentStage.evolves_to[0].evolves_to[0]) {
                evolvedPokemon = currentStage.evolves_to[0].evolves_to[0].species;
            } else {
                evolvedPokemon = currentStage.evolves_to[0].species;
            }

            if (evolvedPokemon) {
                const evolvedPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${evolvedPokemon.name}`);
                if (!evolvedPokemonResponse.ok) throw new Error(`Evolution not found for ${pokemon.name}`);
                const evolvedPokemonData = await evolvedPokemonResponse.json();

                pokemonEvolutionList.push({
                    id: evolvedPokemonData.id,
                    name: evolvedPokemonData.name,
                    image: evolvedPokemonData.sprites.front_default
                });
            }

        } catch (error) {
            console.error(`Error trying to find the evolutions ${pokemon.name}`, error);
        }
    }

    return pokemonEvolutionList;
}