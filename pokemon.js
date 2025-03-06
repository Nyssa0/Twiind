export async function getRandomPokemons(count = 2) {
    const pokemonList = [];
    const pokemonCount = 300;
    const usedEvolutionChains = new Set();
    const usedPokemonIds = new Set();

    while (pokemonList.length < count) {
        const randomId = Math.floor(Math.random() * pokemonCount) + 1;

        if (usedPokemonIds.has(randomId)) continue;

        try {
            const randomPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            if (!randomPokemonResponse.ok) throw new Error(`Pokemon ${randomId} not found`);
            const randomPokemonData = await randomPokemonResponse.json();

            const speciesResponse = await fetch(randomPokemonData.species.url);
            if (!speciesResponse.ok) throw new Error(`Species data not found for Pokemon ${randomId}`);
            const speciesData = await speciesResponse.json();

            const evolutionChainUrl = speciesData.evolution_chain?.url || `no-evolution-${randomId}`;

            if (usedEvolutionChains.has(evolutionChainUrl)) continue;

            usedEvolutionChains.add(evolutionChainUrl);
            usedPokemonIds.add(randomId);

            pokemonList.push({
                id: randomPokemonData.id,
                name: randomPokemonData.name,
                image: randomPokemonData.sprites.front_default,
                hp: randomPokemonData.stats[0].base_stat,
                type: randomPokemonData.types[0].type.name
            });

        } catch (error) {
            console.error(`Erreur lors de la récupération du Pokémon ${randomId}:`, error);
        }
    }

    return pokemonList;
}

export async function getEvolvedPokemons(pokemonList) {
    const pokemonEvolutionList = [];

    for (const pokemon of pokemonList) {
        try {
            const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
            if (!speciesResponse.ok) throw new Error(`Species not found for ${pokemon.name}`);
            const speciesData = await speciesResponse.json();

            const evolutionChainUrl = speciesData.evolution_chain?.url;
            if (!evolutionChainUrl) {
                console.warn(`No evolution chain found for ${pokemon.name}`);
                continue;
            }

            const evolutionResponse = await fetch(evolutionChainUrl);
            if (!evolutionResponse.ok) throw new Error(`Evolution data not found for ${pokemon.name}`);
            const evolutionData = await evolutionResponse.json();

            let evolvedPokemon = null;
            let currentStage = evolutionData.chain;

            if (currentStage.evolves_to?.length > 0) {
                const firstEvolution = currentStage.evolves_to[0];

                if (firstEvolution.evolves_to?.length > 0) {
                    evolvedPokemon = firstEvolution.evolves_to[0].species;
                } else {
                    evolvedPokemon = firstEvolution.species;
                }
            } else {
                evolvedPokemon = pokemon;
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
            console.error(`Error trying to find the evolutions of ${pokemon.name}`, error);
        }
    }

    return pokemonEvolutionList;
}