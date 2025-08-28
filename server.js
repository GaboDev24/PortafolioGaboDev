import "dotenv/config";
import express from "express";
import path from "path";
import fetch from "node-fetch";
import clientPromise from "./api/db.js";
import { ObjectId } from "mongodb";
import session from "express-session";
import connectToDatabase from "./api/db.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- SESSION --------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecreto",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // cambiar a true cuando uses https
  })
);

// -------------------- STATIC FILES --------------------
// Archivos estáticos
app.use(express.static(path.join(process.cwd(), "public")));

// -------------------- VIEWS --------------------
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// -------------------- API --------------------
app.get("/api/projects", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("portafolio");
    const collection = db.collection("proyectos");
    const proyectos = await collection.find({}).toArray();
    res.status(200).json(proyectos);
  } catch (err) {
    console.error("Error en /api/projects:", err);
    res.status(500).json({ error: "Error al obtener proyectos" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { titulo, link, tipo, imagen } = req.body;
    if (!titulo || !tipo) return res.status(400).json({ error: "Faltan datos" });

    const client = await clientPromise;
    const db = client.db("portafolio");
    const collection = db.collection("proyectos");
    await collection.insertOne({ titulo, link, tipo, imagen });
    res.status(201).json({ message: "Proyecto agregado" });
  } catch (err) {
    res.status(500).json({ error: "Error al agregar proyecto" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientPromise;
    const db = client.db("portafolio");
    const collection = db.collection("proyectos");
    await collection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: "Proyecto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
});

// -------------------- LOGIN --------------------
app.post("/api/auth", (req, res) => {
  const { usuario, password } = req.body;

  if (usuario === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.user = usuario;
    return res.redirect("/admin");
  }
  return res.status(401).send("Usuario o contraseña incorrectos");
});

app.get("/login", (req, res) => res.render("login"));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.get("/admin", requireLogin, (req, res) => res.render("admin"));

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// -------------------- PÁGINA PRINCIPAL --------------------
app.get("/", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("proyectos");
    const proyectos = await collection.find({}).toArray();
    res.render("index", { proyectos });
  } catch (err) {
    console.error("Error cargando proyectos:", err);
    res.render("index", { proyectos: [] });
  }
});

// -------------------- LOCAL SERVER --------------------
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

export default app;
