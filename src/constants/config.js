let apisUrl;

if (window.location.host === "htmlproducao.com.br") {
    apisUrl = 'https://casodeproducao/api/'; // Usando 'https' após configurar SSL
} else {
    apisUrl = 'http://localhost:3000/api/'; // 'http' está correto apenas para desenvolvimento local
}

// Páginas
export const setItemsPerPageUrl = apisUrl + 'setItemsPerPage';

export const searchByKeyUrl = apisUrl + 'search/';


