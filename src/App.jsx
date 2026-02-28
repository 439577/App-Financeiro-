import { useState, useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";

import { supabase } from "./supabaseClient";

import {
  Wallet,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Plus,
  Save,
  History,
  Briefcase,
  ShoppingCart,
  Film,
  Fuel,
  Trash2,
  Home,
  Zap,
  Calendar as CalendarIcon,
  Smartphone,
  Wifi,
  CreditCard
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CATEGORIES = {
  'Salário': { icon: Briefcase },
  'Investimentos': { icon: TrendingUp },
  'Aluguel': { icon: Home },
  'Mercado': { icon: ShoppingCart },
  'Lazer': { icon: Film },
  'Transporte': { icon: Fuel },
  'Luz': { icon: Zap },
  'Água': { icon: Zap },
  'Internet Móvel': { icon: Smartphone },
  'Internet': { icon: Wifi },
  'Cartão de Crédito': { icon: CreditCard },
  'Outros': { icon: Wallet }
};

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(v);

export default function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [mesFiltro, setMesFiltro] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "entrada",
    category: "Salário"
  });

  useEffect(() => {
    carregarTransacoes();
  }, []);

  async function carregarTransacoes() {
    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setTransacoes(data);
    else console.log(error);
  }

  const handleAmountChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    setFormData({ ...formData, amount: v });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount) return;

    const valor = Number(
      formData.amount.replace("R$", "").replace(/\./g, "").replace(",", ".")
    );

    const nova = {
      tipo: formData.type,
      valor,
      categoria: formData.category,
      descricao: formData.description || "Sem descrição",
      data: formData.date
    };

    const { error } = await supabase.from("transacoes").insert([nova]);

    if (error) {
      alert("Erro ao salvar");
      return;
    }

    setFormData({ ...formData, amount: "", description: "" });
    carregarTransacoes();
  }

  async function remover(id) {
    await supabase.from("transacoes").delete().eq("id", id);
    carregarTransacoes();
  }

  const listaFiltrada = useMemo(
    () =>
      mesFiltro
        ? transacoes.filter((t) => t.data.startsWith(mesFiltro))
        : transacoes,
    [mesFiltro, transacoes]
  );

  const resumo = useMemo(
    () =>
      listaFiltrada.reduce(
        (acc, t) => {
          const val = Number(t.valor);
          if (t.tipo === "entrada") {
            acc.entradas += val;
            acc.total += val;
          } else {
            acc.saidas += val;
            acc.total -= val;
          }
          return acc;
        },
        { entradas: 0, saidas: 0, total: 0 }
      ),
    [listaFiltrada]
  );

  const dadosGrafico = {
    labels: Object.keys(CATEGORIES),
    datasets: [
      {
        data: Object.keys(CATEGORIES).map((cat) =>
          listaFiltrada
            .filter((t) => t.categoria === cat && t.tipo === "saida")
            .reduce((a, c) => a + Number(c.valor), 0)
        ),
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Finanças Pro</h1>

      {/* RESUMO */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>Entradas: R$ {formatCurrency(resumo.entradas)}</div>
        <div>Saídas: R$ {formatCurrency(resumo.saidas)}</div>
        <div>Saldo: R$ {formatCurrency(resumo.total)}</div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <input
          value={formData.amount}
          onChange={handleAmountChange}
          placeholder="Valor"
          className="w-full p-2 text-black"
        />

        <input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descrição"
          className="w-full p-2 text-black"
        />

        <input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData({ ...formData, date: e.target.value })
          }
          className="w-full p-2 text-black"
        />

        <button className="bg-green-500 px-4 py-2 rounded">
          Salvar
        </button>
      </form>

      {/* FILTRO */}
      <input
        type="month"
        value={mesFiltro}
        onChange={(e) => setMesFiltro(e.target.value)}
        className="p-2 text-black mb-4"
      />

      {/* LISTA */}
      {listaFiltrada.map((t) => (
        <div key={t.id} className="flex justify-between mb-2 border-b pb-2">
          <div>
            {t.descricao} — {t.categoria}
          </div>
          <div>
            R$ {formatCurrency(t.valor)}
            <button
              onClick={() => remover(t.id)}
              className="ml-3 text-red-400"
            >
              excluir
            </button>
          </div>
        </div>
      ))}

      {/* GRÁFICO */}
      <div className="max-w-xs mt-10">
        <Doughnut data={dadosGrafico} />
      </div>
    </div>
  );
}