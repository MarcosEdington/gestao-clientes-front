import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Save, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const EditarCliente: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [ativo, setAtivo] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarCliente = async () => {
            try {
                const response = await api.get(`/Cliente/${id}`);
                const d = response.data;
                
                setNome(d.Nome || d.nome || '');
                setCpf(d.CPF || d.Cpf || d.cpf || '');
                setTelefone(d.Telefone || d.telefone || '');
                setAtivo(d.Ativo !== undefined ? d.Ativo : d.ativo);

                setLoading(false);
            } catch (error) {
                Swal.fire('Erro', 'Cliente não encontrado', 'error');
                navigate('/dashboard');
            }
        };
        carregarCliente();
    }, [id, navigate]);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Criamos o payload exatamente como o C# espera
            const payload = {
                Id: id,
                Nome: nome,
                CPF: cpf,
                Telefone: telefone,
                Ativo: ativo
            };

            // APENAS ESTA CHAMADA. Remova qualquer outra tentativa de api.put ou api.post daqui.
            await api.put(`/Cliente/${id}`, payload);

            // Se chegou aqui, é porque o PUT funcionou!
            await Swal.fire({
                title: 'Sucesso!',
                text: 'Cadastro atualizado com sucesso!',
                icon: 'success',
                confirmButtonColor: '#facc15'
            });
            
            // Agora ele vai voltar para a tela inicial
            navigate('/dashboard');

        } catch (error) {
            console.error("Erro ao salvar:", error);
            Swal.fire('Erro', 'Ocorreu um problema ao salvar as alterações.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
                <div className="spinner-border text-warning" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ background: '#111827' }}>
            <div className="card shadow-lg p-4 border-0 rounded-4" style={{ width: '100%', maxWidth: '500px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-sm btn-outline-secondary border-0 text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <h3 className="fw-bold text-white mb-0">Editar Cliente</h3>
                </div>

                <form onSubmit={handleSalvar}>
                    <div className="mb-3">
                        <label className="form-label text-secondary small fw-bold">NOME COMPLETO</label>
                        <input 
                            type="text" 
                            className="form-control bg-dark text-white border-secondary border-opacity-25" 
                            value={nome} 
                            onChange={e => setNome(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="form-label text-secondary small fw-bold">STATUS DA CONTA</label>
                        <select 
                            className={`form-select bg-dark border-2 ${ativo ? 'border-success text-success' : 'border-danger text-danger'}`}
                            value={ativo ? "true" : "false"}
                            onChange={(e) => setAtivo(e.target.value === "true")}
                        >
                            <option value="true">● ATIVO (LIBERADO)</option>
                            <option value="false">○ INATIVO (BLOQUEADO)</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label text-secondary small fw-bold">CPF</label>
                        <input 
                            type="text" 
                            className="form-control bg-dark text-white border-secondary border-opacity-25" 
                            value={cpf} 
                            onChange={e => setCpf(e.target.value)} 
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="form-label text-secondary small fw-bold">TELEFONE</label>
                        <input 
                            type="text" 
                            className="form-control bg-dark text-white border-secondary border-opacity-25" 
                            value={telefone} 
                            onChange={e => setTelefone(e.target.value)} 
                        />
                    </div>

                    <button type="submit" className="btn btn-warning w-100 fw-bold py-3 shadow d-flex align-items-center justify-content-center gap-2">
                        <Save size={20} /> SALVAR ALTERAÇÕES
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditarCliente;