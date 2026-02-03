import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7157/api', // IMPORTANTE: Veja no seu Back-end qual é a porta (ex: 7121)
});

export default api;