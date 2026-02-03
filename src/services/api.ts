import axios from 'axios';

const api = axios.create({
  //baseURL: 'https://localhost:7157/api', // IMPORTANTE: Veja no seu Back-end qual é a porta (ex: 7121)
  baseURL: 'https://api-gestao-clientes-2cd2.onrender.com', // RENDER
});

export default api;