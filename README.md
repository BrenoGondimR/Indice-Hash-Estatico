# Implementar índice hash estático
## --------------------------------------------------
## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```
## --------------------------------------------------
## Instruções Basicas Projeto
# Implementação de um Índice Hash Estático

Este projeto visa a implementação de um índice hash estático com uma interface gráfica para ilustrar as estruturas de dados e o funcionamento do índice. Seguem os detalhes da implementação:

## Funcionalidades Principais

1. **Construção do Índice:** Criação e estruturação do índice hash estático.
2. **Busca:** Permite a busca por uma tupla utilizando uma chave de busca, através do índice construído.
3. **Table Scan:** Funcionalidade para realizar um scan das X primeiras tuplas.

## Entidades/Estruturas Implementadas

Utilizando Programação Orientada a Objetos (POO), as seguintes entidades/estruturas são implementadas:

- **Tupla:** Representa uma linha da tabela, contendo o valor da chave de busca e os dados da linha.
- **Tabela:** Armazena todas as tuplas, construídas a partir do carregamento do arquivo de dados.
- **Página:** Estrutura de dados que representa a divisão e alocação física da tabela na mídia de armazenamento.
- **Bucket:** Mapeia chaves de busca em endereços de páginas.
- **Função Hash:** Responsável por mapear uma chave de busca em um endereço de bucket. A função deve ser escolhida ou projetada pela equipe.

## Parâmetros

- **Arquivos de Dados:** O projeto utilizará um arquivo com 466 mil palavras do idioma Inglês para popular as tabelas. Disponível em: [GitHub - dwyl/english-words](https://github.com/dwyl/english-words).
- **Tamanho da Página:** Definido pelo usuário, determina o tamanho de cada página.
- **Quantidade de Páginas:** Número máximo de páginas para dividir o conteúdo da tabela. Este é um parâmetro calculado se o usuário definir o tamanho da página.
- **Número de Buckets (NB):** Calculado onde `NB > NR / FR`. `NR` é a cardinalidade da tabela e `FR` é o número de tuplas por bucket.
- **Tamanho dos Buckets (FR):** Número máximo de tuplas endereçadas por bucket.
- **Chave de Busca:** Após a construção do índice, o usuário pode entrar com uma chave de busca para que o sistema retorne a tupla associada.
- **Quantidade de Registros do Table Scan:** Definido pelo usuário, indica quantos registros devem ser mostrados a partir do início.

## Problemas e Soluções

- **Colisões e Overflow:** A implementação do índice contempla algoritmos de resolução de colisões e overflow dos buckets.

## Estatísticas

- Taxa de colisões.
- Taxa de overflows.
- Estimativa de custo (acessos a disco) para uma busca por chave.

## Funcionamento em Passos

1. Carregamento do arquivo de dados em memória.
2. Criação de tuplas a partir de cada linha do arquivo, adicionando-as à tabela.
3. Divisão das tuplas em páginas, conforme o tamanho definido.
4. Criação de NB buckets de tamanho FR.
5. Aplicação da função hash à chave de busca de cada tupla e adição da chave de busca e do endereço da página ao bucket correspondente.

