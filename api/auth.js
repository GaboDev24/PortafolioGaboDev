export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { usuario, password } = req.body;

  if (
    usuario === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    // Simple: redirige a /admin si login correcto
    return res.redirect("/admin");
  }

  return res.status(401).json({ error: "Credenciales inválidas" });
}
