require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API App Neri funcionando 🚀",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      error: JSON.stringify(error),
    });
  }
});

/* NUEVO ENDPOINT */


    res.json({
      status: "ok",
      message: "Tabla users creada",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});