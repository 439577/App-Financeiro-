import { useState, useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { supabase } from "./supabaseClient";

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES = [
  "Salário",
  "Investimentos",
  "Aluguel",
  "Mercado",
  "Lazer",
  "Transporte",
  "Luz",
  "Água",
  "Internet Móvel",
  "Internet",
  "Cartão de Crédito",
  "Outros"
];

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
  }).format(v);

export default function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [mesFiltro, setMesFiltro] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "entrada",
    category: "Salário",
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
  }

  const handleAmountChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    setFormData({ ...formData, amount: v });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount) return;

    const valor = Number(
      formData.amount
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
    );

    const nova = {
      tipo: formData.type,
      valor,
      categoria: formData.category,
      descricao: formData.description || "Sem descrição",
      data: formData.date,
    };

    const { error } = await supabase.from("transacoes").insert([nova]);

    if (!error) {
      setFormData({ ...formData, amount: "", description: "" });
      carregarTransacoes();
    } else {
      alert("Erro ao salvar");
    }
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
    labels: CATEGORIES,
    datasets: [
      {
        data: CATEGORIES.map((cat) =>
          listaFiltrada
            .filter((t) => t.categoria === cat && t.tipo === "saida")
            .reduce((a, c) => a + Number(c.valor), 0)
        ),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Finanças Pro</h1>

      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-sm md:text-base">
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
          className="w-full p-3 rounded text-black"
        />

        <input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descrição"
          className="w-full p-3 rounded text-black"
        />

        <input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData({ ...formData, date: e.target.value })
          }
          className="w-full p-3 rounded text-black"
        />

        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full p-3 rounded text-black text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button className="w-full bg-green-500 py-3 rounded font-semibold">
          Salvar
        </button>
      </form>

      {/* FILTRO */}
      <input
        type="month"
        value={mesFiltro}
        onChange={(e) => setMesFiltro(e.target.value)}
        className="p-2 rounded text-black mb-6 w-full md:w-auto"
      />

      {/* LISTA */}
      <div className="space-y-2">
        {listaFiltrada.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center border-b border-gray-700 pb-2 text-sm md:text-base"
          >
            <div>
              {t.descricao} — {t.categoria}
            </div>
            <div className="flex items-center gap-3">
              R$ {formatCurrency(t.valor)}
              <button
                onClick={() => remover(t.id)}
                className="text-red-400 text-xs"
              >
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO */}
      <div className="w-full max-w-[220px] mx-auto mt-10">
        <Doughnut data={dadosGrafico} />
      </div>
    </div>
  );
}