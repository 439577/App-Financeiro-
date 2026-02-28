
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
    else console.log(error);
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
      formData.amount.replace("R$", "").replace(/\./g, "").replace(",", ".")
    );

    const nova = {
      tipo: formData.type,
      valor,
      categoria: formData.category,
      descricao: formData.description || "Sem descrição",
      data: formData.date,
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
    labels: ["Saídas"],
    datasets: [
      {
        data: [resumo.saidas],
        backgroundColor: ["#00D26A"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 md:p-8">
      
      {/* HEADER */}
      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        💰 Finanças Pro
      </h1>

      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4">
          Entradas
          <div className="text-green-400 text-xl font-bold">
            R$ {formatCurrency(resumo.entradas)}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4">
          Saídas
          <div className="text-red-400 text-xl font-bold">
            R$ {formatCurrency(resumo.saidas)}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4">
          Saldo
          <div className="text-white text-xl font-bold">
            R$ {formatCurrency(resumo.total)}
          </div>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 space-y-4 mb-8"
      >
        <input
          value={formData.amount}
          onChange={handleAmountChange}
          placeholder="Valor"
          className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-white outline-none"
        />

        <input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descrição"
          className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-white outline-none"
        />

        <input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData({ ...formData, date: e.target.value })
          }
          className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-white outline-none"
        />

        <button className="w-full bg-[#00D26A] hover:bg-[#00b35a] text-black font-bold py-3 rounded-xl transition">
          Salvar
        </button>
      </form>

      {/* FILTRO */}
      <input
        type="month"
        value={mesFiltro}
        onChange={(e) => setMesFiltro(e.target.value)}
        className="bg-[#111] border border-[#333] rounded-xl p-3 text-white mb-6"
      />

      {/* LISTA */}
      <div className="space-y-3">
        {listaFiltrada.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center bg-[#1A1A1A] border border-[#262626] rounded-xl p-4"
          >
            <div>
              <div className="font-bold">{t.descricao}</div>
              <div className="text-sm text-gray-400">{t.categoria}</div>
            </div>

            <div className="text-right">
              <div
                className={`font-bold ${
                  t.tipo === "entrada"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                R$ {formatCurrency(t.valor)}
              </div>

              <button
                onClick={() => remover(t.id)}
                className="text-red-400 text-sm"
              >
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO */}
      <div className="max-w-xs mx-auto mt-10">
        <Doughnut data={dadosGrafico} />
      </div>
    </div>
  );
}