const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para permitir requisições de qualquer origem
app.use(cors());
// Tamanho do Bucket
const BUCKET_SIZE_LIMIT = 1000;



function resetState() {
    paginatedWords = [];
    buckets = Array.from({ length: requiredBuckets }, () => ({ words: [], overflow: null }));
    collisionCounter = 0;
    overflowCounter = 0;
}

function loadWordsDictionary() {
    const jsonPath = path.join(__dirname, '..', 'data', 'words_dictionary.json');
    let rawdata = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawdata);
}

function createPages(data, itemsPerPage) {
    const entries = Object.entries(data);
    const pages = [];
    for (let i = 0; i < entries.length; i += itemsPerPage) {
        pages.push(entries.slice(i, i + itemsPerPage).map(entry => entry[0]));
    }
    return pages;
}

// Carrega o arquivo JSON e cria as páginas
let paginatedWords ;

// Esta rota agora é responsável por definir a quantidade de itens por página e criar as páginas
app.post('/api/setItemsPerPage', (req, res) => {
    const { newItemsPerPage } = req.body;
    if (newItemsPerPage && !isNaN(newItemsPerPage)) {
        itemsPerPage = parseInt(newItemsPerPage, 10);
        resetState(); // Reinicializa o estado antes de configurar novos parâmetros
        // Carregando o dicionário de palavras e criando páginas com o novo valor de itemsPerPage
        const wordsDictionary = loadWordsDictionary();
        paginatedWords = createPages(wordsDictionary, itemsPerPage); // Atualiza a variável global paginatedWords
        console.log(paginatedWords);
        insertIntoBuckets(paginatedWords); // Reinicializa e insere as palavras nos buckets com a nova configuração
        const totalRecords = Object.keys(wordsDictionary).length;
        const totalBuckets = buckets.length;
        console.log(collisionCounter);
        console.log(buckets);
        console.log(totalBuckets);
        console.log(totalRecords);

        const collisionRate = totalRecords > 0 ? (collisionCounter / totalRecords) * 100 : 0;
        const overflowRate = totalBuckets > 0 ? (overflowCounter / totalBuckets) * 100 : 0;
        res.json({
            message: "Quantidade de itens por página atualizada.",
            itemsPerPage,
            collisionRate: collisionRate.toFixed(2) + '%',
            overflowRate: overflowRate.toFixed(2) + '%'
        });
    } else {
        res.status(400).json({message: "Por favor, forneça um número válido para a quantidade de itens por página."});
    }
});

// Rota para acessar uma página específica
app.get('/api/pages/:pageNumber', (req, res) => {
    const { pageNumber } = req.params;
    const pageIndex = parseInt(pageNumber, 10) - 1;

    if (pageIndex >= 0 && pageIndex < paginatedWords.length) {
        res.json(paginatedWords[pageIndex]);
    } else {
        res.status(404).send('Page not found');
    }
});

// Função hash simples
function hashFunction(key, size) {
    let hash = 5381; // Inicializa com um número primo grande
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) + hash) + key.charCodeAt(i); // hash * 33 + c
        hash = hash & hash; // Converte para um número de 32bit
    }
    return Math.abs(hash) % size;
}

// Assume totalRecords como o total de palavras no dicionário
const totalRecords = Object.keys(loadWordsDictionary()).length;
// Calcula o número necessário de buckets
const requiredBuckets = Math.ceil(totalRecords / BUCKET_SIZE_LIMIT);
// Inicialização dos buckets com uma estrutura que suporte overflow diretamente
let buckets = Array.from({ length: requiredBuckets }, () => ({ words: [], overflow: null }));
let collisionCounter = 0;
let overflowCounter = 0;

// Função para inserir palavras nos buckets
function insertIntoBuckets(pages) {
    // Reinicializando os contadores para cada nova inserção
    collisionCounter = 0;
    overflowCounter = 0;

    pages.forEach(page => {
        page.forEach(word => {
            const bucketIndex = hashFunction(word, buckets.length);
            let currentBucket = buckets[bucketIndex];

            // Se o bucket já tem palavras, mas ainda não atingiu o limite, a inserção não é uma colisão.
            // Colisões começam quando inserimos em um bucket já cheio (causando overflow).
            if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                // A primeira vez que atingimos o limite e precisamos de um overflow conta como uma colisão.
                // Inserções subsequentes no overflow não aumentam o contador de colisões, mas sim o de overflow.
                if (currentBucket.words.length === BUCKET_SIZE_LIMIT || currentBucket.overflow !== null) {
                    collisionCounter++;
                }

                while (currentBucket.overflow !== null) {
                    currentBucket = currentBucket.overflow;
                }

                if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                    // Criando um novo overflow se o atual está cheio
                    currentBucket.overflow = { words: [word], overflow: null };
                    overflowCounter++;
                } else {
                    currentBucket.words.push(word);
                }
            } else {
                currentBucket.words.push(word);
            }
        });
    });
}

app.get('/api/search/:key', (req, res) => {
    const { key } = req.params;
    const bucketIndex = hashFunction(key, buckets.length);
    let currentBucket = buckets[bucketIndex];
    let totalBucketsAccessed = 1;

    while (currentBucket !== null) {
        if (currentBucket.words.includes(key)) {
            return res.json({
                message: `Palavra encontrada: ${key}`,
                bucket: bucketIndex,
                totalBucketsAccessed: totalBucketsAccessed
            });
        }
        currentBucket = currentBucket.overflow;
        totalBucketsAccessed++;
    }

    return res.status(404).json({
        message: "Palavra não encontrada",
        totalBucketsAccessed: totalBucketsAccessed - 1
    });
});

app.get('/api/table-scan/:numRecords', (req, res) => {
    const { numRecords } = req.params; // Número de registros para mostrar
    const num = parseInt(numRecords, 10);
    let records = [];

    for (let page of paginatedWords) {
        for (let word of page) {
            if (records.length < num) {
                records.push(word);
            } else {
                break;
            }
        }
        if (records.length >= num) break;
    }

    res.json(records);
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
