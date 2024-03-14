import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import BootstrapVue3 from 'bootstrap-vue-3'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import PrimeVue from 'primevue/config';
import Toast from "vue-toastification";
// Import the CSS or use your own!
import "vue-toastification/dist/index.css";

// Importar estilos do PrimeVue
import 'primevue/resources/themes/aura-light-green/theme.css'
import Button from "primevue/button"
import Card from 'primevue/card';

const appInstance = createApp(App);
const options = {
    //
};

appInstance.use(Toast, options);
// Usar BootstrapVue3
appInstance.use(BootstrapVue3)
// Usar PrimeVue
appInstance.use(PrimeVue);
appInstance.component('Button', Button);
appInstance.component('Card', Card);

appInstance.mount("#app");
appInstance.use(router);
