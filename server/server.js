const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

// Tamanho do Bucket
const BUCKET_SIZE_LIMIT = 2466;
// Carrega o arquivo JSON e cria as páginas
let paginatedWords;
// Assume totalRecords como o total de palavras no dicionário
const totalRecords = Object.keys(loadWordsDictionary()).length;
// Calcula o número necessário de buckets
const requiredBuckets = Math.ceil(totalRecords / BUCKET_SIZE_LIMIT);
// Inicialização dos buckets com uma estrutura que suporte overflow diretamente
let buckets = Array.from({length: requiredBuckets}, () => ({words: [], overflow: null}));
let collisionCounter = 0;
let overflowCounter = 0;


function resetState() {
    paginatedWords = [];
    buckets = Array.from({length: requiredBuckets}, () => ({words: [], overflow: null}));
    collisionCounter = 0;
    overflowCounter = 0;
}

function loadWordsDictionary() {
    const jsonPath = path.join(__dirname, '..', 'data', 'words_dictionary.json');
    let rawdata = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawdata);
}

// Define a função createPages que recebe um objeto de dados e o número de itens por página como argumentos
function createPages(data, itemsPerPage) {
    const entries = Object.entries(data);
    const pages = [];
    for (let i = 0; i < entries.length; i += itemsPerPage) {
        const pageIndex = Math.floor(i / itemsPerPage); // Correção aqui
        pages.push(entries.slice(i, i + itemsPerPage).map(entry => ({
            word: entry[0],
            pageIndex // Usando a variável calculada fora do map
        })));
    }
    return pages;
}


// Define a função insertIntoBuckets que recebe 'pages', uma matriz de palavras, como argumento.
function insertIntoBuckets(pages) {
    collisionCounter = 0;
    overflowCounter = 0;

    pages.forEach((page, pageIndex) => {
        page.forEach(({ word, pageIndex }) => { // Ajuste aqui para usar a estrutura atualizada
            const bucketIndex = hashFunction(word, buckets.length);
            let currentBucket = buckets[bucketIndex];

            if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                if (currentBucket.words.length === BUCKET_SIZE_LIMIT || currentBucket.overflow !== null) {
                    collisionCounter++;
                }
                while (currentBucket.overflow !== null) {
                    currentBucket = currentBucket.overflow;
                }
                if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                    currentBucket.overflow = { words: [{word, pageIndex}], overflow: null };
                    overflowCounter++;
                } else {
                    currentBucket.words.push({word, pageIndex});
                }
            } else {
                currentBucket.words.push({word, pageIndex});
            }
        });
    });
}


// Define a função hash que calcula o índice de um array baseado em uma chave e tamanho.
function hashFunction(key, size) {
    let hash = 5381; // Inicia hash com um valor primo alto para distribuição uniforme.
    for (let i = 0; i < key.length; i++) {
        // Calcula o hash multiplicando o valor atual por 33 e somando o código ASCII do caractere atual.
        hash = ((hash << 5) + hash) + key.charCodeAt(i);
        // Garante que hash fique dentro dos limites de um número de 32 bits.
        hash = hash & hash;
    }
    // Retorna o hash mod size para garantir que esteja dentro do intervalo do array.
    return Math.abs(hash) % size;
}

// Define uma rota POST para atualizar a quantidade de itens por página.
app.post('/api/setItemsPerPage', (req, res) => {
    const {newItemsPerPage} = req.body; // Extrai o novo valor de itens por página do corpo da requisição.
    if (newItemsPerPage && !isNaN(newItemsPerPage)) { // Verifica se o valor é um número.
        itemsPerPage = parseInt(newItemsPerPage, 10); // Converte o valor para inteiro.
        resetState(); // Reinicia o estado da aplicação (ex: limpar páginas e buckets existentes).

        // Carrega o dicionário de palavras e cria novas páginas com a quantidade atualizada de itens por página.
        const wordsDictionary = loadWordsDictionary(); // Assume que carrega um dicionário de palavras.
        paginatedWords = createPages(wordsDictionary, itemsPerPage); // Cria páginas com a nova configuração.
        console.log(paginatedWords);

        insertIntoBuckets(paginatedWords); // Insere as palavras nos buckets conforme a nova configuração.

        // Calcula e registra estatísticas sobre o processo de inserção.
        const totalRecords = Object.keys(wordsDictionary).length; // Total de palavras no dicionário.
        const totalBuckets = buckets.length; // Total de buckets.
        console.log(collisionCounter);
        console.log(buckets);
        console.log(totalBuckets);
        console.log(totalRecords);

        // Calcula a taxa de colisão e overflow.
        const collisionRate = totalRecords > 0 ? (collisionCounter / totalRecords) * 100 : 0;
        const overflowRate = totalBuckets > 0 ? (overflowCounter / totalBuckets) * 100 : 0;

        // Retorna uma resposta JSON com a nova configuração e estatísticas.
        res.json({
            message: "Quantidade de itens por página atualizada.",
            itemsPerPage,
            collisionRate: collisionRate.toFixed(2) + '%',
            overflowRate: overflowRate.toFixed(2) + '%'
        });
    } else {
        // Retorna erro se o novo valor de itens por página não for um número válido.
        res.status(400).json({message: "Por favor, forneça um número válido para a quantidade de itens por página."});
    }
});


// Define uma rota GET no servidor Express para pesquisar uma palavra.
app.get('/api/search/:key', (req, res) => {
    const { key } = req.params;
    const bucketIndex = hashFunction(key, buckets.length);
    let currentBucket = buckets[bucketIndex];
    let totalBucketsAccessed = 1;

    while (currentBucket !== null) {
        for (let i = 0; i < currentBucket.words.length; i++) {
            if (currentBucket.words[i].word === key) {
                // Quando encontrar a palavra, retorna também o pageIndex
                return res.json({
                    message: `Palavra encontrada: ${key}`,
                    page: currentBucket.words[i].pageIndex + 1, // Adicionando 1 para tornar o índice base-1
                    bucket: bucketIndex,
                    totalBucketsAccessed
                });
            }
        }
        currentBucket = currentBucket.overflow;
        totalBucketsAccessed++;
    }

    return res.status(404).json({
        message: "Palavra não encontrada",
        totalBucketsAccessed: totalBucketsAccessed - 1
    });
});


// Define uma rota GET para realizar um scan na tabela e retornar um número específico de registros.
app.get('/api/table-scan/:numRecords', (req, res) => {
    const {numRecords} = req.params; // Extrai o número de registros requisitados da URL.
    const num = parseInt(numRecords, 10); // Converte o número de registros para inteiro.
    let records = []; // Inicializa um array para armazenar os registros a serem retornados.
    let pagesAccessed = 0;

    // Itera sobre as páginas de palavras paginadas.
    for (let page of paginatedWords) {
        pagesAccessed++; // Incrementa a cada iteração de página
        // Itera sobre cada palavra na página atual.
        for (let word of page) {
            // Verifica se o array de registros já alcançou o número desejado de registros.
            if (records.length < num) {
                // Se não, adiciona a palavra atual ao array de registros.
                records.push(word);
            } else {
                // Se sim, interrompe o loop interno.
                break;
            }
        }
        // Verifica após cada página se já atingiu o número desejado de registros.
        if (records.length >= num) break; // Interrompe o loop externo se sim.
    }

    // Retorna os registros encontrados como resposta JSON.
    res.json({ records, pagesAccessed });
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
