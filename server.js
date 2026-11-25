const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGO_URI || "mongodb://admin_tienda:Admin1234@ac-d2cwgtu-shard-00-00.wdws0k8.mongodb.net:27017,ac-d2cwgtu-shard-00-01.wdws0k8.mongodb.net:27017,ac-d2cwgtu-shard-00-02.wdws0k8.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);
let coleccion;

async function iniciarCloud() {
  await client.connect();
  const db = client.db('tienda_cloud');
  coleccion = db.collection('zapatillas');
  console.log("Conectado exitosamente a MongoDB Atlas (Cloud) -> BD: tienda_cloud");
}

app.post('/api/zapatillas', async (req, res) => {
  try {
    const { _id, modelo, precio, stock, marca, talla, etiquetas } = req.body;
    const nuevoDoc = {
      _id: Number(_id),
      modelo,
      precio: Number(precio),
      stock: Number(stock),
      detalles: { marca, talla: Number(talla) },
      etiquetas: etiquetas ? etiquetas.split(',').map(e => e.trim()).filter(Boolean) : []
    };
    const resultado = await coleccion.insertOne(nuevoDoc);
    res.json({ mensaje: "Registrado en MongoDB Atlas", resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/zapatillas', async (req, res) => {
  try {
    const { buscar } = req.query;
    const filtro = buscar ? { modelo: new RegExp(buscar, 'i') } : {};
    const lista = await coleccion.find(filtro).sort({ _id: 1 }).toArray();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/zapatillas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { precio, stock } = req.body;
    const resultado = await coleccion.updateOne(
      { _id: id },
      { $set: { precio: Number(precio), stock: Number(stock) } }
    );
    res.json({ mensaje: "Actualizado en MongoDB Atlas", resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/zapatillas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const resultado = await coleccion.deleteOne({ _id: id });
    res.json({ mensaje: "Eliminado de MongoDB Atlas", resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
iniciarCloud().then(() => {
  app.listen(PORT, () => console.log(`Sistema CRUD corriendo en http://localhost:${PORT}`));
}).catch(err => {
  console.error("Error conectando a MongoDB Atlas:", err.message);
  process.exit(1);
});
