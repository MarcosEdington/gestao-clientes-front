import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NovoCliente from './pages/NovoCliente';
import Login from './pages/Login'; // Importe sua nova tela de Login aqui!
import EditarCliente from './pages/EditarCliente';

function App() {
  // Função simples para verificar se o usuário está logado
  const estaAutenticado = () => {
    return !!localStorage.getItem('@Mercadinho:user');
  };

  return (
    <Router>
      <Routes>
        {/* A rota raiz agora é o Login */}
        <Route path="/" element={<Login />} />
        
        {/* Rotas protegidas (Se quiser que só entre logado) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/novo-cliente" element={<NovoCliente />} />
        
        {/* Caso o usuário digite qualquer rota inexistente, volta para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/editar-cliente/:id" element={<EditarCliente />} />
        
      </Routes>
    </Router>
  );
}

export default App;