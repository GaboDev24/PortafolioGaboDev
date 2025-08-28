import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // en .env de Vercel
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: false,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("❌ Falta la variable MONGODB_URI en el entorno");
}

if (process.env.NODE_ENV === "development") {
  // En desarrollo: usar cache global
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción (Vercel)
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
