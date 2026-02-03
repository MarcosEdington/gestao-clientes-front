import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
    UserPlus, ArrowLeft, Save, Store, LayoutDashboard, 
    FileText, LogOut, ShieldCheck, CreditCard, Hash, Phone 
} from 'lucide-react';

const NovoCliente: React.FC = () => {
    const navigate = useNavigate();
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState(''); // Novo campo
    const [telefone, setTelefone] = useState(''); // Novo campo
    const [limite, setLimite] = useState(1500.00); // Conforme sua Model C#
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome) {
            Swal.fire("Atenção", "O nome do cliente é obrigatório.", "warning");
            return;
        }

        setLoading(true);
        try {
            // Enviamos agora com CPF e Telefone incluídos
            await api.post('/Cliente', {
                nome: nome,
                cpf: cpf,
                telefone: telefone,
                limiteCredito: limite,
                saldoUtilizado: 0,
                ativo: true,
                historico: []
            });

            Swal.fire({
                title: "Sucesso!",
                text: "Cliente cadastrado com sucesso e ID único gerado.",
                icon: "success",
                confirmButtonColor: '#facc15',
            }).then(() => navigate('/dashboard')); 

        } catch (error) {
            console.error(error);
            Swal.fire("Erro", "Não foi possível cadastrar o cliente.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh', background: '#F3F4F6' }}>
            {/* SIDEBAR (Mantendo a identidade) */}
            <aside className="d-flex flex-column shadow-lg" style={{ width: '280px', background: '#111827', color: '#fff', position: 'fixed', height: '100vh', zIndex: 100 }}>
                <div className="p-4 d-flex align-items-center gap-3 border-bottom border-secondary border-opacity-20">
                    <div className="bg-warning p-2 rounded-3 text-dark"><Store size={24} /></div>
                    <span className="fw-bold h5 mb-0">Market<span className="text-warning">PRO</span></span>
                </div>
                <div className="p-3 flex-grow-1">
                    <button onClick={() => navigate('/dashboard')} className="btn text-secondary w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 hover-nav"><LayoutDashboard size={20} /> Dashboard</button>
                    <button className="btn btn-warning w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 shadow text-dark fw-bold"><UserPlus size={20} /> Novo Cliente</button>
                    <button onClick={() => navigate('/dashboard')} className="btn text-secondary w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 hover-nav"><FileText size={20} /> Relatório Diário</button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main style={{ marginLeft: '280px', width: 'calc(100% - 280px)' }} className="p-5">
                <header className="mb-5">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-link text-muted p-0 d-flex align-items-center gap-2 mb-3 text-decoration-none">
                        <ArrowLeft size={18} /> Voltar ao Dashboard
                    </button>
                    <h2 className="fw-bold text-dark">Cadastrar Novo Cliente</h2>
                    <p className="text-muted">Preencha os dados abaixo para abrir uma nova conta de crédito.</p>
                </header>

                <div className="row justify-content-start">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="bg-warning p-1"></div>
                            <div className="card-body p-5 bg-white">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <label className="form-label fw-bold text-dark">Nome Completo do Cliente</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><UserPlus size={18} className="text-muted"/></span>
                                                <input 
                                                    type="text" 
                                                    className="form-control bg-light border-start-0 ps-0" 
                                                    placeholder="Ex: Paulo Henrique da Silva"
                                                    value={nome}
                                                    onChange={(e) => setNome(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* NOVO CAMPO: CPF */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-dark">CPF</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><Hash size={18} className="text-muted"/></span>
                                                <input 
                                                    type="text" 
                                                    className="form-control bg-light border-start-0 ps-0" 
                                                    placeholder="000.000.000-00"
                                                    value={cpf}
                                                    onChange={(e) => setCpf(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* NOVO CAMPO: TELEFONE */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-dark">Telefone / WhatsApp</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><Phone size={18} className="text-muted"/></span>
                                                <input 
                                                    type="text" 
                                                    className="form-control bg-light border-start-0 ps-0" 
                                                    placeholder="DD000000000"
                                                    value={telefone}
                                                    onChange={(e) => setTelefone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-dark">Limite de Crédito Inicial</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0"><CreditCard size={18} className="text-muted"/></span>
                                                <input 
                                                    type="number" 
                                                    className="form-control bg-light border-start-0 ps-0" 
                                                    value={limite}
                                                    onChange={(e) => setLimite(Number(e.target.value))}
                                                />
                                            </div>
                                            <small className="text-muted">Padrão do sistema: R$ 1.500,00</small>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-dark">Segurança do ID</label>
                                            <div className="d-flex align-items-center gap-2 text-success mt-2">
                                                <ShieldCheck size={20} />
                                                <span className="small fw-bold">ID Automático (GUID) Ativo</span>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-5">
                                            <hr className="text-muted opacity-25" />
                                            <div className="d-flex gap-3 justify-content-end">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-light px-4 py-2 fw-bold border"
                                                    onClick={() => navigate('/dashboard')}
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-warning px-5 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Salvando...' : <><Save size={18} /> SALVAR CLIENTE</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Card de Resumo Lateral */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white h-100">
                            <h5 className="fw-bold mb-4 text-warning">Resumo da Conta</h5>
                            <div className="mb-3">
                                <label className="text-secondary small d-block">Status</label>
                                <span className="badge bg-success">ATIVO</span>
                            </div>
                            <div className="mb-3">
                                <label className="text-secondary small d-block">Saldo Inicial</label>
                                <span className="h4 fw-bold">R$ 0,00</span>
                            </div>
                            <div className="mb-4">
                                <label className="text-secondary small d-block">Disponível para Compras</label>
                                <span className="h4 fw-bold text-warning">R$ {limite.toFixed(2)}</span>
                            </div>
                            <div className="p-3 bg-secondary bg-opacity-10 rounded-3">
                                <p className="small mb-0 text-secondary italic">"O sistema gerará um identificador global único para garantir que este cliente não seja duplicado."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .hover-nav:hover { background: rgba(255,255,255,0.05); color: #fff !important; }
                .form-control:focus { border-color: #facc15; box-shadow: 0 0 0 0.25rem rgba(250, 204, 21, 0.25); }
            `}</style>
        </div>
    );
};

export default NovoCliente;