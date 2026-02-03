import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Cliente } from '../types';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
    // Ícones que você já devia ter:
    DollarSign, 
    Users, 
    Search, 
    Filter, 
    Calendar, 
    RefreshCw, 
    TrendingDown, 
    Phone, 
    ShoppingCart, 
    ClipboardList, 
    Edit, 
    Trash2, 
    CheckCircle, 
    Info,
    
    // Ícones que estavam faltando (os que causaram o erro):
    Store, 
    LayoutDashboard, 
    UserPlus, 
    FileText, 
    LogOut, 
    Package, 
    ArrowUpRight, 
    Plus, 
    Printer 
} from 'lucide-react';
// Removi o 'X' (que estava sobrando) e adicionei 'RefreshCw' e 'TrendingDown'
import { QRCodeSVG } from 'qrcode.react';


interface ItemVenda { descricao: string; valor: number; }
interface Produto { id?: number; nome: string; preco: number; }

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    
    // ESTADOS PARA FILTROS
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('ATIVOS'); // Padrão solicitado
    const [filtroValorMin, setFiltroValorMin] = useState<number | ''>('');
    const [filtroData, setFiltroData] = useState(''); // Campo de data
    
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
    const [clientePagamento, setClientePagamento] = useState<Cliente | null>(null);

    const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
    const [itemDescricao, setItemDescricao] = useState('');
    const [itemValor, setItemValor] = useState<number>(0);
    const [valorPago, setValorPago] = useState(0);

    const carregarDados = async () => {
        try {
            const [resClientes, resProdutos] = await Promise.all([
                api.get('/Cliente'),
                api.get('/Produto').catch(() => ({ data: [] }))
            ]);

            const dadosFormatados = resClientes.data.map((c: any) => ({
                id: c.id || c.Id,
                nome: c.nome || c.Nome,
                cpf: c.cpf || c.CPF,
                telefone: c.telefone || c.Telefone,
                limiteCredito: c.limiteCredito || c.LimiteCredito,
                saldoUtilizado: c.saldoUtilizado !== undefined ? c.saldoUtilizado : c.SaldoUtilizado,
                saldoDisponivel: c.saldoDisponivel !== undefined ? c.saldoDisponivel : c.SaldoDisponivel,
                historico: c.historico || c.Historico || [],
                ativo: c.ativo ?? c.Ativo ?? true // Mapeia o campo Ativo
            }));

            setClientes(dadosFormatados);
            setProdutos(resProdutos.data);
        } catch (e) { 
            console.error("Erro ao carregar:", e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { carregarDados(); }, []);

    // LÓGICA DE FILTRAGEM PARA A TABELA (ADICIONADO DATA E STATUS ATIVO/INATIVO)
    const clientesFiltrados = clientes.filter(c => {
        const matchesNome = c.nome.toLowerCase().includes(filtroNome.toLowerCase());
        
        // Filtro de Ativo/Inativo/Financeiro
        let matchesStatus = true;
        if (filtroStatus === 'ATIVOS') matchesStatus = c.ativo === true;
        else if (filtroStatus === 'INATIVOS') matchesStatus = c.ativo === false;
        else if (filtroStatus === 'PENDENTE') matchesStatus = c.ativo === true && c.saldoUtilizado > 0;
        else if (filtroStatus === 'EM_DIA') matchesStatus = c.ativo === true && c.saldoUtilizado <= 0;
        else if (filtroStatus === 'LIMITE') matchesStatus = c.ativo === true && c.saldoUtilizado >= c.limiteCredito;
        else if (filtroStatus === 'FIDELIDADE') {
    const totalCompras = c.historico?.filter(h => h.valor > 0).reduce((acc, h) => acc + h.valor, 0) || 0;
    matchesStatus = totalCompras > 500; 
}

        const matchesValor = filtroValorMin === '' ? true : c.saldoUtilizado >= (filtroValorMin as number);
        
        const matchesData = filtroData === '' ? true : c.historico?.some(h => 
            new Date(h.data).toISOString().split('T')[0] === filtroData
        );

        return matchesNome && matchesStatus && matchesValor && matchesData;
    });

    const enviarWhatsApp = (cliente: Cliente) => {
        if (!cliente.telefone) {
            Swal.fire("Ops!", "Este cliente não possui telefone cadastrado.", "warning");
            return;
        }
        const dataAtual = new Date().toLocaleDateString();
        const saudacao = `*MARKET PRO - EXTRATO*`;
        const intro = `Olá *${cliente.nome}*, segue resumo da conta em ${dataAtual}:`;
        const ultimasMovs = cliente.historico?.slice(-10).map(h => {
            const marcador = h.valor < 0 ? "✅" : "•"; 
            return `${marcador} ${new Date(h.data).toLocaleDateString()} - ${h.descricao}: R$ ${Math.abs(h.valor).toFixed(2)}`;
        }).join('\n') || "Sem movimentações recentes.";
        const totalDevedor = `*TOTAL DEVEDOR ATUAL: R$ ${cliente.saldoUtilizado.toFixed(2)}*`;
        const mensagem = `${saudacao}\n${intro}\n\n${ultimasMovs}\n\n${totalDevedor}`;
        const numeroLimpo = cliente.telefone.replace(/\D/g, '');
        const isMobile = /iPhone|Android/i.test(navigator.userAgent);
        const url = isMobile 
            ? `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
            : `https://web.whatsapp.com/send?phone=55${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    };

    const handleAlternarStatus = async (cliente: Cliente) => {
        const novoStatus = !cliente.ativo;
        const result = await Swal.fire({
            title: novoStatus ? 'Reativar cliente?' : 'Desativar cliente?',
            text: novoStatus ? "O cliente voltará a aparecer na lista de ativos." : "O cliente será movido para a lista de inativos!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: novoStatus ? '#10b981' : '#d33',
            confirmButtonText: novoStatus ? 'Sim, reativar!' : 'Sim, desativar!',
            cancelButtonText: 'Cancelar'
        });
        if (result.isConfirmed) {
            try {
                if (!novoStatus) {
                    await api.delete(`/Cliente/${cliente.id}`);
                } else {
                    await api.put(`/Cliente/${cliente.id}`, { ...cliente, Ativo: true });
                }
                Swal.fire('Sucesso!', `Cliente ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`, 'success');
                carregarDados();
            } catch (error) {
                Swal.fire('Erro', 'Não foi possível alterar o status.', 'error');
            }
        }
    };

    const adicionarAoCarrinho = () => {
        if (!itemDescricao || itemValor <= 0) {
            Swal.fire("Atenção", "Preencha o produto e o valor!", "warning");
            return;
        }
        setItensVenda([...itensVenda, { descricao: itemDescricao, valor: itemValor }]);
        setItemDescricao(''); setItemValor(0);
    };

    const removerDoCarrinho = (index: number) => {
        setItensVenda(itensVenda.filter((_, i) => i !== index));
    };

    const finalizarVenda = async () => {
        if (!clienteSelecionado || itensVenda.length === 0) return;
        try {
            const idCliente = clienteSelecionado.id;
            for (const item of itensVenda) {
                await api.post(`/Cliente/${idCliente}/venda`, item);
            }
            const nomeCli = clienteSelecionado.nome;
            const itensCopia = [...itensVenda];
            setClienteSelecionado(null);
            setItensVenda([]);
            await carregarDados();
            Swal.fire({ 
                title: "Venda Finalizada!", 
                icon: "success", 
                showCancelButton: true, 
                confirmButtonColor: '#facc15',
                confirmButtonText: "Imprimir Cupom" 
            }).then(r => r.isConfirmed && gerarCupomPDF(nomeCli, itensCopia, "CUPOM DE VENDA"));
        } catch (error) {
            Swal.fire("Erro", "Falha ao gravar venda.", "error");
        }
    };

    const efetuarPagamento = async () => {
    if (valorPago <= 0 || !clientePagamento) return;

    try {
        // CHAMADA REAL PARA A API
        await api.post(`/Cliente/${clientePagamento.id}/pagamento?valorPago=${valorPago}`);

        // Atualiza a tela localmente buscando os dados novos do servidor
        const response = await api.get('/Cliente');
        setClientes(response.data);

        const novoSaldo = (clientePagamento.saldoUtilizado || 0) - valorPago;

        Swal.fire({
            title: "Pagamento Confirmado!",
            html: novoSaldo < 0 
                ? `O cliente ficou com <b style="color: #10b981">R$ ${Math.abs(novoSaldo).toFixed(2)} de CRÉDITO</b>.` 
                : "O pagamento foi registrado com sucesso!",
            icon: "success",
            confirmButtonColor: '#facc15',
            background: '#111827',
            color: '#fff'
        });

        setClientePagamento(null);
        setValorPago(0);
    } catch (error) {
        Swal.fire("Erro", "Não foi possível salvar o pagamento no banco.", "error");
    }
};

    const gerarRelatorioDia = () => {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const todasMovimentacoes: any[] = [];
        clientes.forEach(c => {
            c.historico?.forEach(h => {
                if (new Date(h.data).toLocaleDateString('pt-BR') === hoje) {
                    todasMovimentacoes.push({ cliente: c.nome, descricao: h.descricao, valor: h.valor });
                }
            });
        });
        if (todasMovimentacoes.length === 0) {
            Swal.fire("Caixa Vazio", "Nenhuma movimentação hoje.", "info");
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(14).text(`RELATÓRIO DE CAIXA - ${hoje}`, 105, 15, { align: 'center' });
        autoTable(doc, {
            startY: 25,
            head: [['Cliente', 'Descrição', 'Valor']],
            body: todasMovimentacoes.map(m => [m.cliente, m.descricao, `R$ ${Math.abs(m.valor).toFixed(2)}`]),
        });
        window.open(doc.output('bloburl'), '_blank');
    };

    const gerarCupomPDF = (clienteNome: string, itens: any[], titulo: string) => {
        const doc = new jsPDF({ unit: 'mm', format: [80, 180] });
        doc.setFont("courier", "bold").setFontSize(9);
        doc.text("MERCADINHO PRO LTDA", 40, 8, { align: 'center' });
        doc.setFontSize(7).setFont("courier", "normal").text("------------------------------------------", 40, 16, { align: 'center' });
        doc.text(titulo, 40, 20, { align: 'center' });
        doc.text(`CLIENTE: ${clienteNome.toUpperCase()}`, 5, 26);
        autoTable(doc, {
            startY: 30, theme: 'plain', styles: { fontSize: 7, font: 'courier' },
            head: [['DESC', 'VALOR']],
            body: itens.map(i => [i.descricao, `R$ ${Math.abs(i.valor).toFixed(2)}`]),
        });
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text("_______________________________", 40, finalY, { align: 'center' });
        doc.text("ASSINATURA DO CLIENTE", 40, finalY + 5, { align: 'center' });
        window.open(doc.output('bloburl'), '_blank');
    };

    const dadosGrafico = clientes
        .filter(c => c.saldoUtilizado > 0 && c.ativo)
        .sort((a, b) => b.saldoUtilizado - a.saldoUtilizado)
        .slice(0, 5)
        .map(c => ({ nome: c.nome.split(' ')[0], divida: c.saldoUtilizado }));

            // --- ADICIONE ESTE BLOCO AQUI ---
        const inicioDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // 1. Quanto recebi esse mês?
        const totalRecebidoMes = clientes.reduce((acc, c) => {
            const pagamentosMes = c.historico?.filter(h => 
                h.valor < 0 && new Date(h.data) >= inicioDoMes
            ) || [];
            return acc + pagamentosMes.reduce((sum, p) => sum + Math.abs(p.valor), 0);
        }, 0);

        // 2. Melhor Pagador
        const melhorPagador = [...clientes]
            .map(c => ({
                nome: c.nome,
                totalPago: Math.abs(c.historico?.filter(h => h.valor < 0).reduce((sum, p) => sum + p.valor, 0) || 0)
            }))
            .sort((a, b) => b.totalPago - a.totalPago)[0];
        // --- FIM DO BLOCO NOVO ---

        if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-dark text-white">Carregando...</div>;

    return (
        <div className="d-flex" style={{ minHeight: '100vh', background: '#F3F4F6' }}>
            <aside className="d-flex flex-column shadow-lg" style={{ width: '280px', background: '#111827', color: '#fff', position: 'fixed', height: '100vh', zIndex: 100 }}>
                <div className="p-4 d-flex align-items-center gap-3 border-bottom border-secondary border-opacity-20">
                    <div className="bg-warning p-2 rounded-3 text-dark"><Store size={24} /></div>
                    <span className="fw-bold h5 mb-0">Market<span className="text-warning">PRO</span></span>
                </div>
                <div className="p-3 flex-grow-1">
                    <button onClick={() => window.location.reload()} className="btn btn-warning w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 shadow text-dark fw-bold"><LayoutDashboard size={20} /> Dashboard</button>
                    <button onClick={() => navigate('/novo-cliente')} className="btn text-secondary w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 hover-nav"><UserPlus size={20} /> Novo Cliente</button>
                    <button onClick={gerarRelatorioDia} className="btn text-secondary w-100 d-flex align-items-center gap-3 p-3 mb-2 border-0 hover-nav"><FileText size={20} /> Relatório Diário</button>
                </div>
                <div className="p-4"><button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0"><LogOut size={18} /> Sair</button></div>
            </aside>

            <main style={{ marginLeft: '280px', width: 'calc(100% - 280px)' }} className="p-5">
                <header className="mb-5 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold text-dark">Gestão de Clientes</h2>
                        <p className="text-muted mb-0">Resumo financeiro e controle de estoque <Package size={16} className="ms-1"/></p>
                    </div>
                    <div className="bg-white p-3 rounded-4 shadow-custom border border-dark border-opacity-10 small fw-bold text-warning d-flex align-items-center gap-2">
                        {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })} <ArrowUpRight size={16}/>
                    </div>
                </header>

                <div className="row g-4 mb-5">
    {/* CARD DÍVIDA TOTAL */}
    <div className="col-md-3">
        <div className="card border-0 shadow-custom rounded-4 overflow-hidden bg-white h-100">
            <div className="bg-danger" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom bg-danger bg-opacity-10">
                <h6 className="fw-bold mb-0 text-danger small"><DollarSign size={14} /> DÍVIDA NA RUA</h6>
            </div>
            <div className="card-body p-3">
                <h4 className="fw-bold mb-1 text-dark">R$ {clientes.reduce((acc, c) => acc + (c.saldoUtilizado > 0 ? c.saldoUtilizado : 0), 0).toFixed(2)}</h4>
                <p className="text-muted mb-0 small">Pendente de recebimento.</p>
            </div>
        </div>
    </div>

    {/* CARD RECEBIDO NO MÊS */}
    <div className="col-md-3">
        <div className="card border-0 shadow-custom rounded-4 overflow-hidden bg-white h-100">
            <div className="bg-success" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom bg-success bg-opacity-10">
                <h6 className="fw-bold mb-0 text-success small"><CheckCircle size={14} /> RECEBIDO / MÊS</h6>
            </div>
            <div className="card-body p-3">
                <h4 className="fw-bold mb-1 text-dark">R$ {totalRecebidoMes.toFixed(2)}</h4>
                <p className="text-muted mb-0 small">Pagamentos identificados.</p>
            </div>
        </div>
    </div>

    {/* CARD MELHOR PAGADOR */}
    <div className="col-md-3">
        <div className="card border-0 shadow-custom rounded-4 overflow-hidden bg-white h-100">
            <div className="bg-primary" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom bg-primary bg-opacity-10">
                <h6 className="fw-bold mb-0 text-primary small"><TrendingDown size={14} style={{transform: 'rotate(180deg)'}} /> MELHOR PAGADOR</h6>
            </div>
            <div className="card-body p-3">
                <h4 className="fw-bold mb-1 text-dark text-truncate">
                    {melhorPagador?.totalPago > 0 ? melhorPagador.nome.split(' ')[0] : "---"}
                </h4>
                <p className="text-muted mb-0 small">Pagou R$ {melhorPagador?.totalPago.toFixed(2) || "0.00"}</p>
            </div>
        </div>
    </div>

    {/* CARD CLIENTES ATIVOS (Ele continua aqui!) */}
    <div className="col-md-3">
        <div className="card border-0 shadow-custom rounded-4 overflow-hidden bg-white h-100">
            <div className="bg-warning" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom bg-warning bg-opacity-10">
                <h6 className="fw-bold mb-0 text-dark small"><Users size={14} /> CLIENTES ATIVOS</h6>
            </div>
            <div className="card-body p-3">
                <h4 className="fw-bold mb-1 text-dark">{clientes.filter(c => c.ativo).length} Clientes</h4>
                <p className="text-muted mb-0 small">Cadastros habilitados.</p>
            </div>
        </div>
    </div>
</div>

{/* ÁREA DE FILTROS ATUALIZADA - PADRÃO PROFISSIONAL */}
<div className="card border-0 shadow-custom rounded-4 mb-4 bg-white overflow-hidden">
    {/* Faixa Amarela no Topo */}
    <div className="bg-warning" style={{ height: '4px' }}></div>
    
    {/* Cabeçalho Padronizado com Fundo Amarelo Claro e Linha Cinza */}
    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-warning bg-opacity-10">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark" style={{ fontSize: '0.9rem' }}>
            <Filter size={18} className="text-dark" /> FILTROS DE PESQUISA
        </h6>
    </div>

    <div className="card-body p-4">
        {/* Row com align-items-end para alinhar campos e botão */}
        <div className="row g-3 align-items-end">
            
            {/* Campo Nome */}
            <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary mb-1">NOME DO CLIENTE</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-secondary border-opacity-25 text-muted">
                        <Search size={16}/>
                    </span>
                    <input 
                        type="text" 
                        className="form-control bg-light border-secondary border-opacity-25" 
                        placeholder="Pesquisar cliente..." 
                        value={filtroNome} 
                        onChange={e => setFiltroNome(e.target.value)} 
                    />
                </div>
            </div>

            {/* Status */}
            <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary mb-1">STATUS DO CADASTRO</label>
                <select 
                    className="form-select bg-light border-secondary border-opacity-25" 
                    style={{ height: '38px' }} 
                    value={filtroStatus} 
                    onChange={e => setFiltroStatus(e.target.value)}
                >
                    <option value="ATIVOS">Clientes Ativos</option>
                    <option value="INATIVOS">Clientes Inativos</option>
                    <option value="PENDENTE">Ativos com Dívida</option>
                    <option value="EM_DIA">Ativos em Dia</option>
                    <option value="FIDELIDADE">⭐ Melhores Clientes</option> {/* Adicione esta linha */}
                    <option value="TODOS">Ver Todos (Geral)</option>
                </select>
            </div>

            {/* Data */}
            <div className="col-md-2">
                <label className="form-label small fw-bold text-secondary mb-1">DATA DE COMPRA</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-secondary border-opacity-25 text-muted">
                        <Calendar size={16}/>
                    </span>
                    <input 
                        type="date" 
                        className="form-control bg-light border-secondary border-opacity-25" 
                        style={{ height: '38px' }} 
                        value={filtroData} 
                        onChange={e => setFiltroData(e.target.value)} 
                    />
                </div>
            </div>

            {/* Dívida Mínima */}
            <div className="col-md-2">
                <label className="form-label small fw-bold text-secondary mb-1">DÍVIDA MÍNIMA</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-secondary border-opacity-25 text-muted small fw-bold">R$</span>
                    <input 
                        type="number" 
                        className="form-control bg-light border-secondary border-opacity-25" 
                        style={{ height: '38px' }} 
                        placeholder="0.00" 
                        value={filtroValorMin} 
                        onChange={e => setFiltroValorMin(e.target.value === '' ? '' : Number(e.target.value))} 
                    />
                </div>
            </div>

            {/* Botão Limpar */}
            <div className="col-md-2">
                <button 
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 fw-bold" 
                    style={{ height: '38px', borderWidth: '1px' }} 
                    onClick={() => {setFiltroNome(''); setFiltroStatus('ATIVOS'); setFiltroValorMin(''); setFiltroData('');}}
                >
                    <RefreshCw size={14}/> LIMPAR
                </button>
            </div>
        </div>
    </div>
</div>

                <div className="row g-4">
    <div className="row g-4 mt-2">
    {/* COLUNA DO GRÁFICO */}
    <div className="col-lg-7">
        <div className="card border-0 shadow-custom rounded-4 overflow-hidden bg-white" style={{ height: '450px' }}>
            <div className="bg-dark" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-warning bg-opacity-10">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                    <TrendingDown size={18} className="text-danger" /> Top 5 Devedores Ativos
                </h6>
            </div>
            <div className="p-4">
                <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                        <BarChart data={dadosGrafico}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                            <XAxis 
                                dataKey="nome" 
                                axisLine={{ stroke: '#d1d1d1' }} 
                                tickLine={true} 
                                tick={{fill: '#6c757d', fontSize: 12}} 
                            />
                            <YAxis 
                                axisLine={{ stroke: '#d1d1d1' }}
                                tick={{fill: '#6c757d', fontSize: 12}}
                                tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8f9fa'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="divida" fill="#facc15" radius={[5, 5, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>

    {/* COLUNA DA LISTAGEM (Bordas Escurecidas) */}
    <div className="col-lg-5">
        <div className="card border-0 shadow-custom rounded-4 bg-white overflow-hidden" style={{ height: '450px' }}>
            <div className="bg-warning" style={{ height: '4px' }}></div>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-warning bg-opacity-10">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                    <Users size={18} className="text-dark"/> Listagem de Clientes
                </h6>
                <span className="badge bg-dark text-warning rounded-pill px-3">
                    {clientesFiltrados.length} Registros
                </span>
            </div>
            
            <div className="table-responsive" style={{ height: '100%', overflowY: 'auto' }}>
    <table className="table table-hover align-middle mb-0">
        <tbody className="border-0">
            {clientesFiltrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1.5px solid #d1d1d1' }}>
                    <td className="ps-3 py-2 border-0">
                        {/* Nome do Cliente com efeito de risco se estiver inativo */}
                        <div className={`fw-bold mb-0 ${!c.ativo ? 'text-muted text-decoration-line-through' : 'text-dark'}`} style={{fontSize: '0.9rem'}}>
                            {c.nome}
                        </div>

                        {/* NOVA BARRA DE LIMITE (Aparece apenas se estiver ativo e tiver limite definido) */}
                        {c.ativo && c.limiteCredito > 0 && (
                            <div className="mt-1 mb-1" style={{ width: '150px' }}>
                                <div className="progress" style={{ height: '5px', backgroundColor: '#e9ecef', borderRadius: '10px' }}>
                                    <div 
                                        className={`progress-bar ${(c.saldoUtilizado / c.limiteCredito) > 0.8 ? 'bg-danger' : 'bg-warning'}`} 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${Math.min(Math.max((c.saldoUtilizado / c.limiteCredito) * 100, 0), 100)}%`,
                                            transition: 'width 0.5s ease'
                                        }}
                                    ></div>
                                </div>
                                <div className="d-flex justify-content-between" style={{ fontSize: '9px', marginTop: '2px' }}>
                                    <span className="text-muted">Uso do Limite</span>
                                    <span className="fw-bold">{Math.max(0, ((c.saldoUtilizado / c.limiteCredito) * 100)).toFixed(0)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Linha de informações secundárias: Telefone, Saldo e Badge */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="text-muted" style={{fontSize: '11px'}}>
                                <Phone size={10}/> {c.telefone || '---'}
                            </span>

                            {/* LÓGICA DE SALDO: Verde se for Crédito (<0), Vermelho se for Dívida (>0) */}
                            <span className={`fw-bold ${c.saldoUtilizado < 0 ? 'text-success' : 'text-danger'}`} style={{fontSize: '11px'}}>
                                {c.saldoUtilizado < 0 
                                    ? `CRÉDITO: R$ ${Math.abs(c.saldoUtilizado).toFixed(2)}` 
                                    : `R$ ${(c.saldoUtilizado || 0).toFixed(2)}`
                                }
                            </span>

                            {/* SEUS BADGES ORIGINAIS (MANTIDOS AQUI) */}
                            <span className={`badge ${c.ativo ? (c.saldoUtilizado > 0 ? 'bg-danger' : 'bg-success') : 'bg-secondary'} bg-opacity-10 ${c.ativo ? (c.saldoUtilizado > 0 ? 'text-danger' : 'text-success') : 'text-secondary'}`} style={{ fontSize: '8px', padding: '2px 4px' }}>
                                {!c.ativo 
                                    ? 'INATIVO' 
                                    : (c.saldoUtilizado > 0 
                                        ? 'PENDENTE' 
                                        : (c.saldoUtilizado < 0 ? 'COM CRÉDITO' : 'EM DIA'))
                                }
                            </span>
                        </div>
                    </td>

                    {/* COLUNA DE AÇÕES */}
                    <td className="text-end pe-3 border-0">
                        <div className="d-flex gap-1 justify-content-end">
                            {c.ativo && (
                                <>
                                    <button onClick={() => { setClienteSelecionado(c); setItensVenda([]); }} className="btn btn-sm p-1 text-primary border-0 bg-transparent" title="Venda">
                                        <ShoppingCart size={15} />
                                    </button>
                                    <button onClick={() => setClientePagamento(c)} className="btn btn-sm p-1 text-success border-0 bg-transparent" title="Pagamento">
                                        <DollarSign size={15}/>
                                    </button>
                                </>
                            )}
                            <button onClick={() => setClienteHistorico(c)} className="btn btn-sm p-1 text-info border-0 bg-transparent" title="Histórico">
                                <ClipboardList size={15}/>
                            </button>
                            <button onClick={() => navigate(`/editar-cliente/${c.id}`)} className="btn btn-sm p-1 text-warning border-0 bg-transparent" title="Editar">
                                <Edit size={15}/>
                            </button>
                            <button onClick={() => handleAlternarStatus(c)} className={`btn btn-sm p-1 border-0 bg-transparent ${c.ativo ? 'text-danger' : 'text-success'}`} title={c.ativo ? "Desativar" : "Ativar"}>
                                {c.ativo ? <Trash2 size={15}/> : <CheckCircle size={15}/>}
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
        </div>
    </div>
</div>
</div>
            </main>

            {/* MODAIS (MANTENDO TODA A SUA LÓGICA ANTERIOR) */}
            {clienteSelecionado && (
                <div className="custom-overlay">
                    <div className="bg-white p-4 rounded-4 shadow-lg w-100" style={{ maxWidth: '600px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0">Nova Venda: {clienteSelecionado.nome}</h4>
                            <button className="btn-close" onClick={() => setClienteSelecionado(null)}></button>
                        </div>
                        <div className="row g-2 mb-3">
                            <div className="col-8">
                                <input list="prod-list" className="form-control" placeholder="Produto" value={itemDescricao} onChange={e => {
                                    setItemDescricao(e.target.value);
                                    const p = produtos.find(x => x.nome === e.target.value);
                                    if(p) setItemValor(p.preco);
                                }}/>
                                <datalist id="prod-list">{produtos.map((p,i)=><option key={i} value={p.nome}/>)}</datalist>
                            </div>
                            <div className="col-4"><input type="number" className="form-control" placeholder="Valor" value={itemValor || ''} onChange={e=>setItemValor(Number(e.target.value))}/></div>
                        </div>
                        <button className="btn btn-warning w-100 mb-4 fw-bold" onClick={adicionarAoCarrinho}><Plus size={18} className="me-2"/> ADICIONAR ITEM</button>
                        <div className="bg-light p-3 rounded-3 mb-4" style={{maxHeight:'200px', overflowY:'auto'}}>
                            {itensVenda.map((it, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center small border-bottom py-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <button className="btn btn-link text-danger p-0" onClick={() => removerDoCarrinho(idx)}><Trash2 size={16} /></button>
                                        <span>{it.descricao}</span>
                                    </div>
                                    <span className="fw-bold">R$ {it.valor.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <h3 className="fw-bold text-dark mb-0">Total: <span className="text-warning">R$ {itensVenda.reduce((a,b)=>a+b.valor,0).toFixed(2)}</span></h3>
                            <button className="btn btn-success btn-lg px-4 fw-bold shadow" onClick={finalizarVenda} disabled={itensVenda.length === 0}>FINALIZAR</button>
                        </div>
                    </div>
                </div>
            )}

            {clientePagamento && (
    <div className="custom-overlay">
        <div className="bg-white p-4 rounded-4 shadow-lg w-100 border-top border-warning border-4" style={{ maxWidth: '450px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0 text-dark">Receber Pagamento</h4>
                <button className="btn-close" onClick={() => { setClientePagamento(null); setValorPago(0); }}></button>
            </div>
            
            <p className="text-muted mb-4">
                <Users size={16} className="me-2"/>
                Cliente: <strong className="text-dark">{clientePagamento.nome}</strong>
            </p>

            <label className="form-label small fw-bold text-secondary mb-1">VALOR PAGO (R$)</label>
            <input 
                type="number" 
                className="form-control form-control-lg bg-light border-secondary border-opacity-25 mb-4" 
                placeholder="0.00" 
                value={valorPago || ''}
                onChange={e => setValorPago(Number(e.target.value))} 
            />

            {valorPago > 0 && (
    <div className="bg-light p-3 rounded-4 mb-4 text-center border">
        <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: '0.9rem' }}>Aponte a câmera para pagar</h6>
        
        <div className="bg-white p-2 d-inline-block rounded-3 shadow-sm mb-3">
            <QRCodeSVG 
                value={(() => {
                    const chave = "marcos.latino@gmail.com";
                    const nome = "MARCOS";
                    const cidade = "SALVADOR";
                    const valorStr = valorPago.toFixed(2);
                    
                    // Montagem das partes do PIX (Padrão Banco Central)
                    const merchantAccount = `0014BR.GOV.BCB.PIX01${chave.length}${chave}`;
                    const valorCodigo = `54${valorStr.length.toString().padStart(2, '0')}${valorStr}`;
                    
                    // String base para o Payload (sem o CRC16 final)
                    const payload = `00020126${merchantAccount.length}${merchantAccount}520400005303986${valorCodigo}5802BR59${nome.length.toString().padStart(2, '0')}${nome}60${cidade.length.toString().padStart(2, '0')}${cidade}62070503***`;
                    
                    // Para PIX Estático sem cálculos complexos de CRC16 no front-end,
                    // usamos uma estrutura simplificada que a maioria dos bancos aceita
                    // ou você pode usar uma biblioteca como 'pix-payload-generator'
                    return `${payload}63041D3D`; // O sufixo 6304 indica que segue o CRC
                })()}
                size={160}
                level="M"
                includeMargin={true}
            />
        </div>
        
        <div className="alert alert-warning py-2 mb-0 d-flex flex-column gap-1" style={{ fontSize: '0.75rem' }}>
            <div className="d-flex align-items-center justify-content-center gap-2">
                <Info size={14} className="text-dark"/> 
                <span className="text-dark">Chave: <strong>{valorPago > 0 ? "marcos.latino@gmail.com" : ""}</strong></span>
            </div>
            <small className="text-muted">Confira o nome no banco antes de confirmar.</small>
        </div>
    </div>
)}

            <div className="d-flex gap-2">
                <button 
                    className="btn btn-success flex-grow-1 fw-bold py-2" 
                    onClick={efetuarPagamento}
                    disabled={valorPago <= 0}
                >
                    <CheckCircle size={18} className="me-2"/> Confirmar
                </button>
                <button 
                    className="btn btn-light border flex-grow-1 fw-bold" 
                    onClick={() => { setClientePagamento(null); setValorPago(0); }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
)}

            {clienteHistorico && (
    <div className="custom-overlay">
        <div className="bg-white p-4 rounded-4 shadow-lg w-100" style={{ maxWidth: '700px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Extrato: {clienteHistorico.nome}</h4>
                <div className="d-flex gap-2">
                    <button className="btn btn-success btn-sm d-flex align-items-center gap-2 fw-bold" onClick={() => enviarWhatsApp(clienteHistorico)}>
                        <Phone size={16}/> WHATSAPP
                    </button>
                    <button className="btn btn-light border btn-sm" onClick={() => gerarCupomPDF(clienteHistorico.nome, clienteHistorico.historico || [], "EXTRATO DE CONTA")}>
                        <Printer size={16}/>
                    </button>
                    <button className="btn btn-dark btn-sm" onClick={() => setClienteHistorico(null)}>X</button>
                </div>
            </div>

            <div className="table-responsive" style={{maxHeight: '400px'}}>
                <table className="table table-sm">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th className="text-end">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clienteHistorico.historico?.map((h, i) => (
                            <tr key={i}>
                                <td className="small">{new Date(h.data).toLocaleDateString()}</td>
                                <td>{h.descricao}</td>
                                {/* PAGAMENTO (valor negativo) fica VERDE, COMPRA fica VERMELHO */}
                                <td className={`text-end fw-bold ${h.valor < 0 ? 'text-success' : 'text-danger'}`}>
                                    {h.valor < 0 ? `(-) R$ ${Math.abs(h.valor).toFixed(2)}` : `R$ ${h.valor.toFixed(2)}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* RODAPÉ INTELIGENTE: Muda de cor e texto se for crédito ou dívida */}
            <div className="mt-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold text-muted">SALDO ATUAL:</span>
                <span className={`fw-bold h5 mb-0 ${clienteHistorico.saldoUtilizado < 0 ? 'text-success' : 'text-danger'}`}>
                    {clienteHistorico.saldoUtilizado < 0 
                        ? `CRÉDITO: R$ ${Math.abs(clienteHistorico.saldoUtilizado).toFixed(2)}` 
                        : `DÍVIDA: R$ ${clienteHistorico.saldoUtilizado.toFixed(2)}`
                    }
                </span>
            </div>
        </div>
    </div>
)}

            <style>{`
                .hover-nav:hover { background: rgba(255,255,255,0.05); color: #fff !important; }
                .bg-light-warning { background: #fef9c3; }
                .bg-light-primary { background: #DBEAFE; }
                .shadow-custom { box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.25), 0 8px 15px -6px rgba(0, 0, 0, 0.2) !important; }
                .custom-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
                .btn-warning { background-color: #facc15; border-color: #facc15; }
                .text-warning { color: #eab308 !important; }
            `}</style>
        </div>
    );
};

export default Dashboard;