import clientPromise from "./db.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("portafolio");
  const collection = db.collection("proyectos");

  if (req.method === "GET") {
    const proyectos = await collection.find({}).toArray();
    return res.status(200).json(proyectos);
  }

  if (req.method === "POST") {
    const { titulo, link, tipo, imagen } = req.body;

    if (!titulo || !tipo) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    await collection.insertOne({ titulo, link, tipo, imagen });
    return res.status(201).json({ message: "Proyecto agregado" });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Falta ID" });

    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Proyecto eliminado" });
  }

  res.status(405).json({ error: "Método no permitido" });
}