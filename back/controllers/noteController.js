const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const definitionWord = async (req, res) => {
    try {
        const { word } = req.params;
        console.log('définition bien appellée');
        const acceptLanguage = req.get('Accept-Language') || 'en';

        console.log(`Recherche définition pour: ${word}`);
        console.log(`Langue détectée: ${acceptLanguage}`);

        // Détection simple : si Accept-Language contient 'fr', c'est français
        const isFrench = acceptLanguage.toLowerCase().includes('fr');

        let apiUrl, response;

        if (isFrench) {
            console.log('Recherche via Wiktionnaire HTML (cheerio)...');

            apiUrl = `https://fr.wiktionary.org/wiki/${word}`;
            response = await axios.get(apiUrl);

            const $ = cheerio.load(response.data);

            // Récupérer jusqu'à 3 définitions dans la première liste ordonnée <ol>
            const definitions = [];
            $('ol li').slice(0, 3).each((i, el) => {
                const text = $(el).text().trim();
                if (text) definitions.push(text);
            });

            if (definitions.length === 0) {
                return res.status(404).json({
                    error: 'Définition introuvable',
                    word,
                    language: 'Français',
                    url: apiUrl
                });
            }

            // STRUCTURE UNIFIÉE : toujours un tableau de chaînes
            res.json({
                word,
                language: 'Français',
                source: 'Wiktionnaire (HTML)',
                definitions, // Tableau de chaînes
                url: apiUrl
            });

        } else {
            console.log('Utilisation API anglaise...');

            // API Free Dictionary anglais
            apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
            response = await axios.get(apiUrl);

            const data = response.data[0];

            // CONVERTIR EN TABLEAU DE CHAÎNES POUR UNIFORMISER
            const definitions = [];
            for (const meaning of data.meanings) {
                for (const def of meaning.definitions) {
                    const formattedDef = `(${meaning.partOfSpeech}) ${def.definition}`;
                    definitions.push(formattedDef);
                    if (definitions.length === 3) break;
                }
                if (definitions.length === 3) break;
            }

            // Récupérer quelques exemples si disponibles
            const examples = [];
            for (const meaning of data.meanings) {
                for (const def of meaning.definitions) {
                    if (def.example) {
                        examples.push(def.example);
                        if (examples.length === 3) break;
                    }
                }
                if (examples.length === 3) break;
            }

            // STRUCTURE UNIFIÉE : même format que le français
            res.json({
                word: data.word,
                language: 'Anglais',
                source: 'Free Dictionary',
                phonetic: data.phonetic,
                definitions, // Maintenant tableau de chaînes uniformisé
                examples      // Ajout des exemples
            });
        }

    } catch (error) {
        console.error('Erreur API:', error.message);
        res.status(404).json({
            error: 'Définition non trouvée',
            word: req.params.word,
            message: error.message
        });
    }
};

module.exports = { definitionWord }