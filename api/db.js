import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ Falta la variable MONGODB_URI en el entorno");
}

let cachedClient = null;
let cachedDb = null;

export default async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Reducir el tiempo de espera a 5 segundos
  });

  try {
    await client.connect();
    const db = client.db("portafolio");

    // Cachear la conexión
    cachedClient = client;
    cachedDb = db;

    console.log("✅ Conectado a MongoDB");
    return { client, db };
  } catch (err) {
    console.error("❌ Error de conexión a MongoDB:", err);
    throw err;
  }
}