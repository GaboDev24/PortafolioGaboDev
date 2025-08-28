import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ Falta la variable MONGODB_URI en el entorno");
}

// Opciones recomendadas para MongoDB Atlas
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // timeout para selección de servidor
  socketTimeoutMS: 45000           // timeout de socket
};

let client;
let clientPromise;

// Cache global para evitar reconexiones en serverless / Vercel
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
