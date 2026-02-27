const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O BANCO ---
const db = mysql.createConnection({
    host: "localhost",
    user: "appuser",      // Seu usuário correto
    password: "1234",     // Sua senha correta
    database: "financeiro",
});

db.connect(err => {
    if (err) {
        console.error("❌ Erro ao conectar no banco:", err);
        return;
    }
    console.log("✅ Conectado ao MySQL com sucesso!");
});

// --- ROTA 1: LISTAR (GET) ---
// O site usa isso para montar o gráfico e a lista
app.get("/transacoes", (req, res) => {
    const sql = "SELECT * FROM transacoes ORDER BY data DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar dados:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// --- ROTA 2: SALVAR (POST) ---
// É aqui que o botão "Salvar" do site bate
app.post("/transacoes", (req, res) => {
    const { tipo, valor, categoria, descricao, data } = req.body;

    // Comando SQL para inserir no banco
    const sql = "INSERT INTO transacoes (tipo, valor, categoria, descricao, data) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [tipo, valor, categoria, descricao, data], (err, result) => {
        if (err) {
            console.error("❌ Erro ao salvar no banco:", err);
            return res.status(500).send("Erro ao salvar: " + err.message);
        }
        console.log("✅ Nova transação salva:", descricao, valor);
        res.json({ id: result.insertId, msg: "Salvo com sucesso" });
    });
});

// --- ROTA 3: DELETAR (DELETE) ---
// Para o botão de lixeira funcionar
app.delete("/transacoes/:id", (req, res) => {
    const sql = "DELETE FROM transacoes WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ msg: "Item deletado" });
    });
});

// --- INICIA O SERVIDOR ---
app.listen(3001, () => {
    console.log("🚀 Servidor rodando na porta 3001");
});