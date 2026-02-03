import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { LogIn, Store, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Efeito de Skeleton com 1.5s de delay
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/Auth/login', { email, senha });
            localStorage.setItem('@Mercadinho:user', response.data.usuario);
            navigate('/dashboard');
        } catch { 
            alert('Erro no login'); 
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ background: '#111827' }}>
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-md-4 col-lg-3">
                    <div className="card shadow-custom rounded-4 border border-white border-opacity-10" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)' }}>
                        <div className="card-body p-4">
                            {loading ? (
                                /* SKELETON LOADING */
                                <div className="skeleton-wrapper">
                                    <div className="skeleton skeleton-logo mb-4 mx-auto"></div>
                                    <div className="skeleton skeleton-text mb-2"></div>
                                    <div className="skeleton skeleton-input mb-3"></div>
                                    <div className="skeleton skeleton-text mb-2"></div>
                                    <div className="skeleton skeleton-input mb-4"></div>
                                    <div className="skeleton skeleton-btn"></div>
                                </div>
                            ) : (
                                /* CONTEÚDO REAL */
                                <>
                                    <div className="text-center mb-4">
                                        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                            <div className="bg-warning p-2 rounded-3 text-dark">
                                                <Store size={28} />
                                            </div>
                                            <h2 className="fw-bold h3 mb-0 text-white">
                                                Market<span className="text-warning">PRO</span>
                                            </h2>
                                        </div>
                                        <p className="text-secondary small">Gestão de Crédito Inteligente</p>
                                    </div>

                                    <form onSubmit={handleLogin}>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold text-secondary small">E-mail</label>
                                            <input 
                                                type="email" 
                                                className="form-control bg-dark border-secondary border-opacity-25 text-white" 
                                                placeholder="Digite o usuario" 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary small">Senha</label>
                                            <div className="input-group">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    className="form-control bg-dark border-secondary border-opacity-25 text-white border-end-0" 
                                                    placeholder="Digite a senha" 
                                                    onChange={e => setSenha(e.target.value)} 
                                                    required 
                                                />
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary border-secondary border-opacity-25 border-start-0"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 shadow">
                                            <LogIn size={20} /> Entrar no Sistema
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* SOMBRA FORTE PADRÃO DASHBOARD */
                .shadow-custom { 
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important; 
                }

                .form-control:focus {
                    background-color: #1f2937 !important;
                    border-color: #facc15 !important;
                    color: white;
                    box-shadow: none;
                }

                /* ESTILOS DO SKELETON */
                .skeleton {
                    background: rgba(255, 255, 255, 0.05);
                    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 8px;
                }
                .skeleton-logo { width: 60px; height: 60px; border-radius: 12px; }
                .skeleton-text { width: 40%; height: 12px; }
                .skeleton-input { width: 100%; height: 40px; }
                .skeleton-btn { width: 100%; height: 45px; border-radius: 8px; }

                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .btn-warning { background-color: #facc15; border-color: #facc15; color: #000; }
                .btn-warning:hover { background-color: #eab308; }
            `}</style>
        </div>
    );
};

export default Login;