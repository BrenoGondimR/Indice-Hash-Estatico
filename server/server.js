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
    // Converte o objeto de dados em um array de [chave, valor] usando Object.entries
    const entries = Object.entries(data);
    // Inicializa um array vazio para armazenar as páginas criadas
    const pages = [];
    // Usa um loop for para iterar sobre as entradas, incrementando pelo número de itens por página a cada iteração
    for (let i = 0; i < entries.length; i += itemsPerPage) {
        // Adiciona ao array de páginas uma nova página contendo apenas as chaves das entradas atuais, limitado pelo número de itens por página
        pages.push(entries.slice(i, i + itemsPerPage).map(entry => entry[0]));
    }
    // Retorna o array de páginas criado
    return pages;
}


// Define a função insertIntoBuckets que recebe 'pages', uma matriz de palavras, como argumento.
function insertIntoBuckets(pages) {
    // Inicializa contadores de colisões e overflow para monitorar a inserção.
    collisionCounter = 0;
    overflowCounter = 0;
    console.log('oi')
    // Itera sobre cada página (array de palavras) dentro de 'pages'.
    pages.forEach(page => {
        // Itera sobre cada palavra na página atual.
        page.forEach(word => {
            // Calcula o índice do bucket para a palavra atual usando uma função hash.
            const bucketIndex = hashFunction(word, buckets.length);
            // Acessa o bucket atual com base no índice calculado.
            let currentBucket = buckets[bucketIndex];

            // Verifica se o bucket atingiu o limite de tamanho. A lógica de colisão começa aqui.
            if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                // Incrementa o contador de colisões se estivermos inserindo em um bucket cheio pela primeira vez.
                if (currentBucket.words.length === BUCKET_SIZE_LIMIT || currentBucket.overflow !== null) {
                    collisionCounter++;
                }
                // Procura por um bucket de overflow disponível se o bucket atual estiver cheio.
                while (currentBucket.overflow !== null) {
                    currentBucket = currentBucket.overflow;
                }
                // Verifica novamente se o bucket atual (ou de overflow) está cheio.
                if (currentBucket.words.length >= BUCKET_SIZE_LIMIT) {
                    // Cria um novo bucket de overflow se necessário e insere a palavra nele.
                    currentBucket.overflow = {words: [word], overflow: null};
                    overflowCounter++;
                } else {
                    // Se ainda houver espaço, simplesmente insere a palavra no bucket atual.
                    currentBucket.words.push(word);
                }
            } else {
                // Se o bucket inicial não estiver cheio, insere a palavra diretamente.
                currentBucket.words.push(word);
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
    const {key} = req.params; // Extrai a chave (palavra) a ser procurada da URL.
    const bucketIndex = hashFunction(key, buckets.length); // Calcula qual bucket procurar com base na chave.
    let currentBucket = buckets[bucketIndex]; // Acessa o bucket inicial.
    let totalBucketsAccessed = 1; // Inicia a contagem de buckets acessados.

    // Enquanto houver buckets para verificar (incluindo overflows).
    while (currentBucket !== null) {
        // Verifica se a palavra atual existe no bucket.
        if (currentBucket.words.includes(key)) {
            // Se encontrada, retorna informações sobre a busca.
            return res.json({
                message: `Palavra encontrada: ${key}`,
                bucket: bucketIndex,
                totalBucketsAccessed: totalBucketsAccessed
            });
        }
        // Se não encontrada no bucket atual, passa para o overflow.
        currentBucket = currentBucket.overflow;
        totalBucketsAccessed++; // Incrementa o contador de buckets acessados.
    }

    // Se a palavra não for encontrada após verificar todos os buckets e overflows.
    return res.status(404).json({
        message: "Palavra não encontrada",
        totalBucketsAccessed: totalBucketsAccessed - 1 // Ajusta a contagem para não incluir a última tentativa.
    });
});

// Define uma rota GET para realizar um scan na tabela e retornar um número específico de registros.
app.get('/api/table-scan/:numRecords', (req, res) => {
    const {numRecords} = req.params; // Extrai o número de registros requisitados da URL.
    const num = parseInt(numRecords, 10); // Converte o número de registros para inteiro.
    let records = []; // Inicializa um array para armazenar os registros a serem retornados.

    // Itera sobre as páginas de palavras paginadas.
    for (let page of paginatedWords) {
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
    res.json(records);
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
