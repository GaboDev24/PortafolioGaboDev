import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import clientPromise from "./api/db.js";
import { ObjectId } from "mongodb";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecreto",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// 👉 API para proyectos
app.get("/api/projects", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("portafolio");
    const proyectos = await db.collection("proyectos").find({}).toArray();
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
    await db.collection("proyectos").insertOne({ titulo, link, tipo, imagen });
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
    await db.collection("proyectos").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: "Proyecto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
});

// Login y admin
app.post("/api/auth", (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.user = usuario;
    return res.redirect("/admin");
  } else {
    return res.status(401).send("❌ Usuario o contraseña incorrectos");
  }
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.get("/login", (req, res) => res.render("login"));
app.get("/admin", requireLogin, (req, res) => res.render("admin"));
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// 👉 Página principal (sin fetch a localhost)
app.get("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("portafolio");
    const proyectos = await db.collection("proyectos").find({}).toArray();
    res.render("index", { proyectos });
  } catch (err) {
    console.error("Error cargando proyectos:", err);
    res.render("index", { proyectos: [] });
  }
});

// Export para Vercel
export default app;

// Solo si corres localmente
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
}
