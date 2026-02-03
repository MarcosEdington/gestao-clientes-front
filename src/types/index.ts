// src/types/index.ts
export interface Cliente {
    id: string;
    nome: string;
    cpf: string;       // Adicione esta linha
    telefone: string;  // Adicione esta linha
    ativo: boolean;    // Adicione esta linha
    limiteCredito: number;
    saldoUtilizado: number;
    saldoDisponivel: number;
    historico: Compra[];
}

export interface Compra {
    id?: string;
    descricao: string;
    valor: number;
    data: string;
}