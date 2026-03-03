import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './App.css';

// --- CONFIGURAÇÃO DE ACESSO (MUITO IMPORTANTE) ---
// Troque 'localhost' pelo SEU IP se quiser usar no celular (ex: '192.168.0.15')
// Se for usar só no PC, pode deixar '192.168.1.23'
const IP_DO_COMPUTADOR = 'localhost'; 
const API_URL = `http://${IP_DO_COMPUTADOR}:3001/transacoes`;

// Registra os componentes dos gráficos (Pizza e Barras)
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [idEditando, setIdEditando] = useState(null);
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));

  const CATEGORIAS_ENTRADA = ['Salário Dani', 'Salário Val', 'Aluguel', 'Outros'];
  const CATEGORIAS_SAIDA = [
    'Habitação', 'Luz', 'Água', 'Cartão de Crédito', 
    'Internet Móvel', 'Internet Fixa', 'Escolar', 'Mercado', 'Lazer', 'Outros'
  ];

  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'entrada',
    categoria: CATEGORIAS_ENTRADA[0],
    data: new Date().toISOString().split('T')[0]
  });

  // --- FUNÇÕES AUXILIARES ---
  const formatarMoedaVisual = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const limparValor = (valorFormatado) => {
    if (typeof valorFormatado === 'number') return valorFormatado;
    if (!valorFormatado) return 0;
    const apenasNumeros = valorFormatado.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    return parseFloat(apenasNumeros) || 0;
  };

  const mascaraMoedaInput = (valor) => {
    const apenasDigitos = valor.replace(/\D/g, ""); 
    const numero = Number(apenasDigitos) / 100;
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // --- BUSCA DADOS ---
  useEffect(() => { listarTransacoes(); }, []);

  const listarTransacoes = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTransacoes(data);
    } catch (error) { console.error("Erro ao buscar. Verifique o IP!", error); }
  };

  // --- FILTROS E CÁLCULOS ---
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t => t.data.startsWith(filtroMes));
  }, [transacoes, filtroMes]);

  const resumo = useMemo(() => {
    const entradas = transacoesFiltradas.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0);
    const saidas = transacoesFiltradas.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoesFiltradas]);

  // --- AÇÕES ---
  const salvar = async (e) => {
    e.preventDefault();
    const valorNumerico = limparValor(form.valor);
    if (!valorNumerico) return alert("Preencha o valor!");

    try {
      const url = idEditando ? `${API_URL}/${idEditando}` : API_URL;
      const method = idEditando ? 'PUT' : 'POST';

      const dadosParaSalvar = {
        ...form,
        valor: valorNumerico,
        descricao: form.descricao || 'Sem descrição'
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaSalvar)
      });

      setForm({ 
        descricao: '', valor: '', tipo: 'entrada', categoria: CATEGORIAS_ENTRADA[0], 
        data: new Date().toISOString().split('T')[0] 
      });
      setIdEditando(null);
      listarTransacoes();
    } catch (error) { console.error("Erro:", error); alert("Erro ao salvar! Verifique se o IP está correto."); }
  };

  const preencherParaEditar = (t) => {
    setIdEditando(t.id);
    setForm({ ...t, valor: formatarMoedaVisual(t.valor), data: t.data.split('T')[0] });
  };

  const deletar = async (id) => {
    if (!confirm("Tem certeza?")) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    listarTransacoes();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'valor') setForm({ ...form, valor: mascaraMoedaInput(value) });
    else if (name === 'tipo') {
      const novaCategoria = value === 'entrada' ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0];
      setForm({ ...form, tipo: value, categoria: novaCategoria });
    } else setForm({ ...form, [name]: value });
  };

  // --- GRÁFICOS ---
  const dadosPizza = useMemo(() => {
    const saidas = transacoesFiltradas.filter(t => t.tipo === 'saida');
    const categorias = {};
    saidas.forEach(t => categorias[t.categoria] = (categorias[t.categoria] || 0) + Number(t.valor));
    return {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#f97316', '#ec4899', '#6366f1'],
        borderWidth: 0,
      }],
    };
  }, [transacoesFiltradas]);

  const dadosBarras = {
    labels: ['Entradas', 'Saídas'],
    datasets: [{
      label: 'Comparativo Mensal',
      data: [resumo.entradas, resumo.saidas],
      backgroundColor: ['#22c55e', '#ef4444'], // Verde e Vermelho
      borderRadius: 5,
    }]
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans box-border overflow-x-hidden">
      
      {/* CABEÇALHO */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent uppercase">
            Financeiro Wi-Fi
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg border border-gray-700">
          <span className="text-gray-400 pl-2">📅 Mês:</span>
          <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-gray-700 border-none rounded p-1 text-white focus:ring-2 focus:ring-blue-500 cursor-pointer" />
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Entradas</span>
          <span className="text-3xl font-bold text-green-400 whitespace-nowrap">{formatarMoedaVisual(resumo.entradas)}</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Saídas</span>
          <span className="text-3xl font-bold text-red-400 whitespace-nowrap">{formatarMoedaVisual(resumo.saidas)}</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col items-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${resumo.saldo >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-400 text-sm mb-2 font-bold uppercase tracking-wider">Saldo Atual</span>
          <span className={`text-3xl font-bold whitespace-nowrap ${resumo.saldo >= 0 ? 'text-white' : 'text-red-500'}`}>
            {formatarMoedaVisual(resumo.saldo)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO E GRÁFICOS */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-5 text-white flex items-center gap-2 border-b border-gray-700 pb-2">
              {idEditando ? '✏️ Editar' : '➕ Novo Lançamento'}
            </h3>
            <form onSubmit={salvar} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 ml-1 mb-1 block uppercase">Valor</label>
                  <input name="valor" type="text" inputMode="numeric" placeholder="R$ 0,00" value={form.valor} onChange={handleChange} 
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white text-right text-lg font-bold focus:outline-none focus:border-blue-500" />
                </div>
                <div className="w-1/3">
                  <label className="text-xs text-gray-500 ml-1 mb-1 block uppercase">Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} 
                    className={`w-full p-3 rounded-lg text-white border border-transparent font-bold h-[54px] focus:outline-none ${form.tipo === 'entrada' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 ml-1 mb-1 block uppercase">Categoria</label>
                <select name="categoria" value={form.categoria} onChange={handleChange} 
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  {form.tipo === 'entrada' ? CATEGORIAS_ENTRADA.map(c => <option key={c} value={c}>{c}</option>) : CATEGORIAS_SAIDA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 ml-1 mb-1 block uppercase">Descrição</label>
                <input name="descricao" placeholder="..." value={form.descricao} onChange={handleChange} 
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 ml-1 mb-1 block uppercase">Data</label>
                <input name="data" type="date" value={form.data} onChange={handleChange} 
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={`flex-1 py-3 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all ${idEditando ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'}`}>
                  {idEditando ? 'Salvar' : 'Adicionar'}
                </button>
                {idEditando && <button type="button" onClick={() => { setIdEditando(null); setForm({ ...form, descricao: '', valor: '' }); }} className="bg-gray-700 text-white px-4 rounded-xl">✕</button>}
              </div>
            </form>
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Gráfico 1: Barras (Entradas vs Saídas) */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col items-center">
               <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest font-bold">Balanço do Mês</p>
               <div className="w-full h-48">
                  <Bar data={dadosBarras} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }, x: { ticks: { color: '#9ca3af' }, grid: { display: false } } } }} />
               </div>
            </div>

            {/* Gráfico 2: Pizza (Categorias) */}
            {transacoesFiltradas.some(t => t.tipo === 'saida') && (
              <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col items-center">
                  <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest font-bold">Onde estou gastando?</p>
                  <div className="w-40 h-40">
                        <Pie data={dadosPizza} options={{ plugins: { legend: { display: false } } }} />
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: TABELA */}
        <div className="xl:col-span-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 flex flex-col h-fit">
           <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold text-gray-300">📜 Lançamentos</h3>
              <span className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-500">{transacoesFiltradas.length} itens</span>
           </div>
           <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-900/30 text-gray-400 text-xs uppercase tracking-wider">
                <tr><th className="p-4">Data</th><th className="p-4">Categoria / Descrição</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transacoesFiltradas.length > 0 ? transacoesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">{new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          <div className={`w-1 h-8 rounded-full ${t.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div><div className="font-bold text-white">{t.categoria}</div><div className="text-sm text-gray-500">{t.descricao}</div></div>
                      </div>
                    </td>
                    <td className={`p-4 font-bold text-lg text-right whitespace-nowrap ${t.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>{formatarMoedaVisual(t.valor)}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                          <button onClick={() => preencherParaEditar(t)} className="bg-gray-900 text-blue-500 w-8 h-8 rounded hover:bg-blue-600 hover:text-white transition-all">✏️</button>
                          <button onClick={() => deletar(t.id)} className="bg-gray-900 text-red-500 w-8 h-8 rounded hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" className="p-16 text-center text-gray-600">Nenhum lançamento.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;