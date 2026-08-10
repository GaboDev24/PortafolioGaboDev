require('dotenv').config();
const express     = require('express');
const mongoose    = require('mongoose');
const session     = require('express-session');
const MongoStore  = require('connect-mongo');
const cloudinary  = require('cloudinary').v2;
const multer      = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ══════════════════════════════════════
   CLOUDINARY CONFIG
══════════════════════════════════════ */
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder        : 'gabodev-portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    resource_type : 'auto',
  },
});
const upload = multer({ storage });

/* ══════════════════════════════════════
   MONGOOSE MODELS
══════════════════════════════════════ */
const projectSchema = new mongoose.Schema({
  title      : { type: String, required: true },
  description: { type: String, default: '' },
  category   : { type: String, enum: ['programming', 'web', 'design', 'video'], required: true },
  imageUrl   : { type: String, default: '' },
  videoUrl   : { type: String, default: '' },
  githubUrl  : { type: String, default: '' },
  tags       : [String],
  link       : { type: String, default: '' },
  featured   : { type: Boolean, default: false },
  order      : { type: Number, default: 0 },
  createdAt  : { type: Date, default: Date.now },
});

const Project = mongoose.model('Project', projectSchema);

/* ══════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret           : process.env.SESSION_SECRET || 'gabodev-secret',
  resave           : false,
  saveUninitialized: false,
  store            : MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie           : { maxAge: 1000 * 60 * 60 * 24 }, // 24h
}));

/* ══════════════════════════════════════
   AUTH MIDDLEWARE
══════════════════════════════════════ */
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/admin/login');
}

/* ══════════════════════════════════════
   PUBLIC ROUTES — serve index
══════════════════════════════════════ */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ══════════════════════════════════════
   API — PROJECTS (public read)
══════════════════════════════════════ */
app.get('/api/projects', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== 'all' ? { category } : {};
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects/featured', async (req, res) => {
  try {
    const projects = await Project.find({ featured: true }).sort({ order: 1 }).limit(6);
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN — LOGIN
══════════════════════════════════════ */
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.authenticated = true;
    req.session.user = username;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/admin/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

/* ══════════════════════════════════════
   ADMIN — PANEL
══════════════════════════════════════ */
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

/* ══════════════════════════════════════
   ADMIN API — CREATE PROJECT
══════════════════════════════════════ */
app.post('/admin/api/projects', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const { title, description, category, tags, link, featured, order, videoUrl, githubUrl } = req.body;
    const project = new Project({
      title,
      description,
      category,
      tags       : tags ? tags.split(',').map(t => t.trim()) : [],
      link       : link || '',
      githubUrl  : githubUrl || '',
      featured   : featured === 'true' || featured === true,
      order      : parseInt(order) || 0,
      imageUrl   : req.file ? req.file.path : '',
      videoUrl   : videoUrl || '',
    });
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN API — GET ALL PROJECTS
══════════════════════════════════════ */
app.get('/admin/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN API — UPDATE PROJECT
══════════════════════════════════════ */
app.put('/admin/api/projects/:id', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const { title, description, category, tags, link, featured, order, videoUrl, githubUrl } = req.body;
    const update = {
      title, description, category,
      tags     : tags ? tags.split(',').map(t => t.trim()) : [],
      link     : link || '',
      githubUrl: githubUrl || '',
      featured : featured === 'true' || featured === true,
      order    : parseInt(order) || 0,
      videoUrl : videoUrl || '',
    };
    if (req.file) update.imageUrl = req.file.path;
    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN API — DELETE PROJECT
══════════════════════════════════════ */
app.delete('/admin/api/projects/:id', requireAuth, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════════════════════
   CV DOWNLOAD
══════════════════════════════════════════════════════ */
app.get('/cv', (req, res) => {
  const cvPath = path.join(__dirname, 'CV.pdf');
  res.download(cvPath, 'GaboDev-CV.pdf', err => {
    if (err) res.status(404).json({ error: 'CV no encontrado' });
  });
});

/* ══════════════════════════════════════════════════════
   CONNECT DB & START
══════════════════════════════════════════════════════ */

// Conectar a MongoDB (requerido tanto en local como en Vercel)
let dbConnected = false;
async function connectDB() {
  if (dbConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  dbConnected = true;
  console.log('[DB] MongoDB connected');
}

// En entorno local (no Vercel), levantar el servidor normalmente
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`[SERVER] Running at http://localhost:${PORT}`));
    })
    .catch(err => {
      console.error('[DB] Connection error:', err.message);
      process.exit(1);
    });
}

// Wrapper que conecta a la DB antes de cada request en Vercel (serverless)
const handler = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  return app(req, res);
};

module.exports = handler;
