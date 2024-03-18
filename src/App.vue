<template>
  <b-container class="mt-5 card-principal">
    <b-row>
      <b-col>
        <h2>Construção de Índice</h2>
        <b-form-group label="Defina a quantidade de páginas:" label-for="pagesInput">
          <b-form-input id="pagesInput" type="number" v-model="qtdPaginas" placeholder="Quantidade de Páginas"></b-form-input>
        </b-form-group>
        <Button  label="Construir Índice" @click="construirIndice" raised style="border-radius: 8px !important;" />
      </b-col>
    </b-row>

    <b-row class="mt-5">
      <b-col>
        <h2>Busca de Tupla</h2>
        <b-form-group label="Digite a chave para busca:" label-for="searchInput">
          <b-form-input :disabled="disableTupla" id="searchInput" v-model="chaveBusca" placeholder="Chave de Busca"></b-form-input>
        </b-form-group>
        <Button :disabled="disableTupla" @click="buscarPorChave" label="Buscar por Chave" severity="info" raised style="border-radius: 8px !important;" />
        <!-- Exibindo os resultados da busca -->
        <div v-if="resultadoBusca.message" class="mt-3">
          <p>{{ resultadoBusca.message }}</p>
          <p v-if="resultadoBusca.totalBucketsAccessed">Paginas Acessadas: {{ resultadoBusca.totalBucketsAccessed }}</p>
          <p v-if="resultadoBusca.page">Pagina: {{ resultadoBusca.page }}</p>
          <p v-if="typeof resultadoBusca.bucket !== 'undefined'">Índice no Bucket: {{ resultadoBusca.bucket }}</p>
        </div>

        <b-form-group label="Digite o número de registros para o Table Scan:" label-for="scanInput" class="mt-3">
          <b-form-input :disabled="disableTupla" id="scanInput" type="number" v-model="numRegistros" placeholder="Número de Registros"></b-form-input>
        </b-form-group>
        <Button :disabled="disableTupla" @click="realizarTableScan" label="Realizar Table Scan" severity="info" raised style="border-radius: 8px !important;" />
        <b-table striped hover :items="records" class="mt-3">
          <template #cell(word)="data">
            {{ data.item.word }}
          </template>
        </b-table>
        <p class="mt-3">Páginas Acessadas: {{ pagesAccessed }}</p>
      </b-col>
    </b-row>

    <b-row class="mt-5">
      <b-col>
        <h2 class="stats-heading">Estatísticas</h2>
        <div class="stats-results mt-3">
          <div class="stat-item">
            <p class="stat-label">Colisão:</p>
            <b-progress variant="success" :value="collisionRate" animated></b-progress>
            <p class="stat-percentage">{{ collisionRate }}%</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Overflow:</p>
            <b-progress variant="warning" :value="overflowRate" animated></b-progress>
            <p class="stat-percentage">{{ overflowRate }}%</p>
          </div>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>

import ProgressCircle from "@/components/ProgressCircle.vue";
import { useToast } from "vue-toastification";
import {postConstruirIndice, searchForKey, tableScan} from "@/app_service";
export default {
  name: 'StatsButton',
  components: {ProgressCircle},
  setup() {
    // Get toast interface
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      qtdPaginas: 0,
      disableTupla: true,
      chaveBusca: '',
      numRegistros: 0,
      collisionRate: 0,
      overflowRate: 0,
      resultadoBusca: {}, // Estado para armazenar o resultado da busca
      records: [],
    }
  },
  methods: {
    construirIndice() {
      postConstruirIndice(this.qtdPaginas)
          .then(response => {
            this.toast.success("Indice Construido Com Sucesso!", {
              timeout: 2000
            });
            // Atualizar o estado com os valores retornados pela API
            this.collisionRate = parseFloat(response.data.collisionRate);
            this.overflowRate = parseFloat(response.data.overflowRate);
            this.disableTupla = false
            console.log(response.data);
          })
          .catch(error => {
            // Trate erros aqui
            console.error(error);
            this.toast.error("Erro ao construir índice!", {
              timeout: 2000
            });
          });
    },
    buscarPorChave() {
      this.disableTupla = true; // Desabilita o botão/formulário durante a busca
      searchForKey(this.chaveBusca)
          .then(response => {
            this.resultadoBusca = response.data; // Armazena o resultado da busca
            this.disableTupla = false;
            this.toast.success("Palavra Encontrada!", {
              timeout: 2000
            });
          })
          .catch(error => {
            console.error(error);
            this.disableTupla = false; // Reabilita o botão/formulário em caso de erro
            this.toast.error("Erro Ao Achar Palavra!", {
              timeout: 2000
            });

          });
    },
    realizarTableScan() {
      tableScan(this.numRegistros)
          .then(response => {
            this.records = response.data.records.map(item => ({ word: item }));
            this.pagesAccessed = response.data.pagesAccessed; // Atualiza a variável com o número de páginas acessadas
          })
          .catch(error => {
            console.error("Erro ao realizar table scan: ", error);
          });
    }
  },
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
#app {
  font-family: "Poppins", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

.card-principal{
  background: #f6f6f6;
  border-radius: 12px;
  margin-bottom: 50px;
  padding: 30px !important;
  box-shadow: 0 4px 8px 0 rgba(107, 107, 107, 0.2), 0 6px 20px 0 rgba(107, 107, 107, 0.2);

}

.stats-heading {
  color: #2c3e50;
  font-weight: bold;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.stats-results {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-item {
  margin-bottom: 1.5rem;
}

.stat-label {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.stat-percentage {
  font-weight: bold;
  text-align: right;
  color: #333;
}

/* Adiciona um pouco mais de estilo às barras de progresso */
.b-progress {
  margin-bottom: 0.5rem;
}

.b-progress-bar {
  background-image: linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent);
  animation: progress-bar-stripes 1s linear infinite;
}

</style>
