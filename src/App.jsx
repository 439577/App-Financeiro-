import { useState, useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { 
  Wallet, ArrowUp, ArrowDown, TrendingUp, Plus, 
  Save, Filter, History, Briefcase, ShoppingCart, Film, Fuel, 
  Trash2, Home, Zap, Search, Bell, Calendar as CalendarIcon,
  Smartphone, Wifi, CreditCard // <--- ÍCONES NOVOS AQUI
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- CATEGORIAS ATUALIZADAS ---
const CATEGORIES = {
  'Salário': { icon: Briefcase, color: 'bg-emerald-500/10 text-emerald-500' },
  'Investimentos': { icon: TrendingUp, color: 'bg-green-500/10 text-green-500' },
  'Aluguel': { icon: Home, color: 'bg-orange-500/10 text-orange-500' },
  'Mercado': { icon: ShoppingCart, color: 'bg-red-500/10 text-red-500' },
  'Lazer': { icon: Film, color: 'bg-purple-500/10 text-purple-500' },
  'Transporte': { icon: Fuel, color: 'bg-blue-500/10 text-blue-500' },
  'Luz': { icon: Zap, color: 'bg-yellow-500/10 text-yellow-500' },
  'Água': { icon: Zap, color: 'bg-cyan-500/10 text-cyan-500' },
  
  // --- NOVAS CATEGORIAS ---
  'Internet Móvel': { icon: Smartphone, color: 'bg-indigo-500/10 text-indigo-500' },
  'Internet': { icon: Wifi, color: 'bg-sky-500/10 text-sky-500' },
  'Cartão de Crédito': { icon: CreditCard, color: 'bg-rose-500/10 text-rose-500' },

  'Outros': { icon: Wallet, color: 'bg-gray-500/10 text-gray-400' }
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);

const formatDate = (dateString) => {
  if(!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
};

export default function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'entrada',
    category: 'Salário'
  });
  const [mesFiltro, setMesFiltro] = useState("");

  useEffect(() => { carregarTransacoes(); }, []);

  useEffect(() => {
    if (formData.type === "entrada") setFormData(prev => ({...prev, category: "Salário"}));
    else setFormData(prev => ({...prev, category: "Mercado"}));
  }, [formData.type]);

  const handleAmountChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    const formatted = numericValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    setFormData({ ...formData, amount: formatted });
  };

  async function carregarTransacoes() {
    try {
      const resp = await fetch("http://localhost:3001/transacoes");
      if (resp.ok) setTransacoes(await resp.json());
    } catch (err) { console.error("Erro backend", err); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount || formData.amount === 'R$ 0,00') return alert("Digite um valor!");

    const valorLimpoString = formData.amount.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    const valorNum = Number(valorLimpoString);
    
    const nova = { 
        tipo: formData.type, 
        valor: valorNum, 
        categoria: formData.category, 
        descricao: formData.description || "Sem descrição", 
        data: formData.date 
    };

    try {
        const resposta = await fetch("http://localhost:3001/transacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nova),
        });

        if (resposta.ok) {
            setFormData(prev => ({ ...prev, amount: '', description: '' }));
            const mesDaConta = nova.data.slice(0, 7);
            setMesFiltro(mesDaConta);
            carregarTransacoes(); 
        } else { alert("Erro ao salvar."); }
    } catch (erro) { alert("Erro de conexão."); }
  }

  async function remover(id) {
    if(!confirm("Tem certeza que deseja apagar?")) return;
    try {
        await fetch(`http://localhost:3001/transacoes/${id}`, { method: "DELETE" });
        carregarTransacoes();
    } catch (e) { alert("Erro ao deletar"); }
  }

  const listaFiltrada = useMemo(() => mesFiltro ? transacoes.filter(t => t.data.startsWith(mesFiltro)) : transacoes, [mesFiltro, transacoes]);

  const resumo = useMemo(() => listaFiltrada.reduce((acc, t) => {
      const val = Number(t.valor);
      if (t.tipo === "entrada") { acc.entradas += val; acc.total += val; }
      else { acc.saidas += val; acc.total -= val; }
      return acc;
  }, { entradas: 0, saidas: 0, total: 0 }), [listaFiltrada]);

  const dadosDoughnut = {
    labels: Object.keys(CATEGORIES),
    datasets: [{
      data: Object.keys(CATEGORIES).map(cat => 
        listaFiltrada.filter(t => t.categoria === cat && t.tipo === 'saida').reduce((acc, curr) => acc + Number(curr.valor), 0)
      ),
      backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1", "#EC4899", "#06B6D4", "#6366F1", "#0EA5E9", "#F43F5E", "#6B7280"],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 font-sans p-6">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 bg-[#1A1A1A] p-4 rounded-2xl border border-[#262626]">
          <div className="flex items-center gap-4">
            <div className="bg-[#00D26A] p-2.5 rounded-xl shadow-[0_0_15px_rgba(0,210,106,0.3)]">
                <Wallet className="w-6 h-6 text-black" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Finanças Pro</h1>
                <p className="text-[#666] text-xs font-bold tracking-widest uppercase">Dashboard Financeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#333]">
                <div className="w-2 h-2 rounded-full bg-[#00D26A] animate-pulse"></div>
                <span className="text-xs text-[#888] font-medium">Sistema Online</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500"></div>
          </div>
      </header>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#262626] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[#666] text-xs font-bold tracking-widest uppercase">Entradas</span>
                <div className="p-2 bg-[#00D26A]/10 rounded-lg text-[#00D26A]"><ArrowUp className="w-4 h-4" /></div>
            </div>
            <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-[#00D26A] text-sm font-medium">R$</span>
                    <span className="text-4xl font-bold text-white">{formatCurrency(resumo.entradas)}</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00D26A] to-transparent opacity-50"></div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#262626] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[#666] text-xs font-bold tracking-widest uppercase">Saídas</span>
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><ArrowDown className="w-4 h-4" /></div>
            </div>
            <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-red-500 text-sm font-medium">R$</span>
                    <span className="text-4xl font-bold text-white">{formatCurrency(resumo.saidas)}</span>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent opacity-50"></div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#262626] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[#666] text-xs font-bold tracking-widest uppercase">Saldo Total</span>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Wallet className="w-4 h-4" /></div>
            </div>
            <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-gray-400 text-sm font-medium">R$</span>
                    <span className={`text-4xl font-bold ${resumo.total >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {formatCurrency(resumo.total)}
                    </span>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50"></div>
          </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FORMULÁRIO */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <div className="bg-[#262626] p-1.5 rounded-lg"><Plus className="w-4 h-4 text-[#00D26A]" /></div>
                Nova Transação
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1.5 block">Valor</label>
                    <input type="text" placeholder="R$ 0,00" value={formData.amount} onChange={handleAmountChange} className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-white placeholder-[#333] focus:border-[#00D26A] outline-none transition-all font-semibold text-lg" />
                </div>
                
                <div>
                    <label className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1.5 block">Descrição</label>
                    <input type="text" placeholder="Ex: Salário..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-white placeholder-[#333] focus:border-[#00D26A] outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1.5 block">Tipo</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-white outline-none focus:border-[#00D26A]">
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1.5 block">Categoria</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-white outline-none focus:border-[#00D26A]">
                            {formData.type === 'entrada' ? ( <> <option>Salário</option><option>Investimentos</option><option>Aluguel</option><option>Outros</option> </> ) : ( Object.keys(CATEGORIES).map(cat => <option key={cat}>{cat}</option>) )}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] text-[#666] font-bold uppercase tracking-wider mb-1.5 block">Data</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-xl py-3 px-4 text-white outline-none focus:border-[#00D26A] appearance-none" style={{ colorScheme: 'dark' }} />
                </div>

                <button type="submit" className="w-full bg-[#00D26A] hover:bg-[#00b059] text-black font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,210,106,0.2)]">
                   <Save className="w-5 h-5" /> Salvar no Banco
                </button>
              </form>
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-6">
                 <h3 className="text-[#888] text-xs font-bold uppercase mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Gastos por Categoria
                 </h3>
                 <div className="w-52 h-52 mx-auto relative">
                    <Doughnut data={dadosDoughnut} options={{ cutout: '70%', plugins: {legend: {display: false}}, elements: {arc: {borderWidth: 0}}}} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[#666] text-xs font-bold uppercase">Total</span>
                        <span className="text-white font-bold text-lg">{formatCurrency(resumo.saidas)}</span>
                    </div>
                 </div>
            </div>
          </div>

          {/* LISTA HISTÓRICO */}
          <div className="lg:col-span-8">
            <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl flex flex-col h-full min-h-[600px]">
              
              <div className="p-8 border-b border-[#262626] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-[#262626] p-2 rounded-lg"><History className="w-5 h-5 text-[#8B5CF6]" /></div>
                    Histórico Recente
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#00D26A]" />
                        <input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="bg-[#111] border border-[#333] text-white text-sm rounded-lg py-2 pl-9 pr-8 outline-none focus:border-[#00D26A]" style={{ colorScheme: 'dark' }} />
                        {mesFiltro && (<button onClick={() => setMesFiltro("")} className="absolute top-2.5 right-2 text-xs text-red-500 font-bold hover:text-red-400">X</button>)}
                    </div>
                </div>
              </div>
              
              <div className="hidden md:flex px-8 py-4 border-b border-[#262626] text-[10px] uppercase font-bold text-[#555] tracking-widest">
                  <div className="w-[40%]">Transação</div>
                  <div className="w-[30%] text-center">Categoria</div>
                  <div className="w-[30%] text-right">Valor</div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-1 custom-scrollbar">
                {listaFiltrada.length === 0 ? ( 
                    <div className="flex flex-col items-center justify-center h-64 text-[#444]">
                        <History className="w-12 h-12 mb-4 opacity-20" />
                        <p>Nenhuma transação encontrada.</p>
                    </div> 
                ) : (
                  listaFiltrada.map((t) => {
                    const catInfo = CATEGORIES[t.categoria] || CATEGORIES['Outros'];
                    const Icon = catInfo.icon;
                    return (
                      <div key={t.id} className="group flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl hover:bg-[#202020] transition-colors cursor-default border border-transparent hover:border-[#333]">
                        <div className="flex items-center gap-4 w-full md:w-[40%] mb-3 md:mb-0">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${catInfo.color.replace('text-', 'bg-').replace('/10', '/20')} text-white`}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-bold text-white text-sm">{t.descricao}</h4>
                             <p className="text-xs text-[#666] mt-1 flex items-center gap-1">{formatDate(t.data)}</p>
                          </div>
                        </div>
                        <div className="w-full md:w-[30%] flex justify-start md:justify-center mb-3 md:mb-0 pl-16 md:pl-0">
                             <span className={`text-[10px] font-bold uppercase tracking-wide border px-3 py-1.5 rounded-full ${catInfo.color.includes('emerald') ? 'border-emerald-500/30 text-emerald-500' : 'border-[#333] text-[#888]'}`}>{t.categoria}</span>
                        </div>
                        <div className="w-full md:w-[30%] flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                          <span className={`block font-bold text-base ${t.tipo === 'entrada' ? 'text-[#00D26A]' : 'text-[#F94A4A]'}`}>{t.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(t.valor))}</span>
                          <button onClick={() => remover(t.id)} className="p-2 text-[#444] hover:text-[#F94A4A] hover:bg-[#F94A4A]/10 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}