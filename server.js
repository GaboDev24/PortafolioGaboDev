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
  images     : { type: [String], default: [] },
  videoUrl   : { type: String, default: '' },
  githubUrl  : { type: String, default: '' },
  tags       : [String],
  link       : { type: String, default: '' },
  featured   : { type: Boolean, default: false },
  order      : { type: Number, default: 0 },
  createdAt  : { type: Date, default: Date.now },
});

const Project = mongoose.model('Project', projectSchema);

const workPreviewSchema = new mongoose.Schema({
  title      : { type: String, default: '' },
  subtitle   : { type: String, default: '' },
  imageUrl   : { type: String, required: true },
  link       : { type: String, default: '' },
  order      : { type: Number, default: 0 },
  createdAt  : { type: Date, default: Date.now },
});

const WorkPreview = mongoose.model('WorkPreview', workPreviewSchema);

function formatProject(p) {
  const doc = p && p.toObject ? p.toObject() : { ...p };
  const imgs = [];
  if (doc.imageUrl) imgs.push(doc.imageUrl);
  if (Array.isArray(doc.images)) {
    doc.images.forEach(img => {
      if (img && typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed && !imgs.includes(trimmed)) imgs.push(trimmed);
      }
    });
  }
  doc.images = imgs;
  return doc;
}

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
    const rawProjects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    const projects = rawProjects.map(formatProject);
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects/featured', async (req, res) => {
  try {
    const rawProjects = await Project.find({ featured: true }).sort({ order: 1 }).limit(6);
    const projects = rawProjects.map(formatProject);
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   API — WORK PREVIEWS (public read)
══════════════════════════════════════ */
app.get('/api/work-previews', async (req, res) => {
  try {
    const previews = await WorkPreview.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, previews });
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
const projectUpload = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'gallery', maxCount: 15 }
]);

app.post('/admin/api/projects', requireAuth, projectUpload, async (req, res) => {
  try {
    const { title, description, category, tags, link, featured, order, videoUrl, githubUrl, additionalImages } = req.body;

    const coverFile = req.files && req.files.media && req.files.media[0];
    const galleryFiles = req.files && req.files.gallery ? req.files.gallery.map(f => f.path) : [];

    let extraUrls = [];
    if (additionalImages) {
      if (Array.isArray(additionalImages)) {
        extraUrls = additionalImages;
      } else if (typeof additionalImages === 'string') {
        extraUrls = additionalImages.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
      }
    }

    const allImages = [...galleryFiles, ...extraUrls];
    const primaryCover = coverFile ? coverFile.path : (allImages[0] || req.body.imageUrl || '');

    const project = new Project({
      title,
      description,
      category,
      tags       : tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags) : [],
      link       : link || '',
      githubUrl  : githubUrl || '',
      featured   : featured === 'true' || featured === true,
      order      : parseInt(order) || 0,
      imageUrl   : primaryCover,
      images     : allImages,
      videoUrl   : videoUrl || '',
    });
    await project.save();
    res.json({ success: true, project: formatProject(project) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN API — GET ALL PROJECTS
══════════════════════════════════════ */
app.get('/admin/api/projects', requireAuth, async (req, res) => {
  try {
    const raw = await Project.find().sort({ createdAt: -1 });
    const projects = raw.map(formatProject);
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ══════════════════════════════════════
   ADMIN API — UPDATE PROJECT
══════════════════════════════════════ */
app.put('/admin/api/projects/:id', requireAuth, projectUpload, async (req, res) => {
  try {
    const { title, description, category, tags, link, featured, order, videoUrl, githubUrl, existingImages, additionalImages } = req.body;

    let keptImages = [];
    if (existingImages) {
      if (Array.isArray(existingImages)) {
        keptImages = existingImages;
      } else if (typeof existingImages === 'string') {
        try {
          const parsed = JSON.parse(existingImages);
          if (Array.isArray(parsed)) keptImages = parsed;
          else keptImages = existingImages.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        } catch {
          keptImages = existingImages.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const newGallery = req.files && req.files.gallery ? req.files.gallery.map(f => f.path) : [];

    let extraUrls = [];
    if (additionalImages) {
      if (Array.isArray(additionalImages)) {
        extraUrls = additionalImages;
      } else if (typeof additionalImages === 'string') {
        extraUrls = additionalImages.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
      }
    }

    const combinedImages = [...keptImages, ...newGallery, ...extraUrls];

    const update = {
      title, description, category,
      tags     : tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags) : [],
      link     : link || '',
      githubUrl: githubUrl || '',
      featured : featured === 'true' || featured === true,
      order    : parseInt(order) || 0,
      videoUrl : videoUrl || '',
      images   : combinedImages,
    };

    if (req.files && req.files.media && req.files.media[0]) {
      update.imageUrl = req.files.media[0].path;
    } else if (req.body.imageUrl) {
      update.imageUrl = req.body.imageUrl;
    } else if (combinedImages.length > 0 && !update.imageUrl) {
      update.imageUrl = combinedImages[0];
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, project: formatProject(updated) });
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
   ADMIN API — WORK PREVIEWS
══════════════════════════════════════════════════════ */
app.get('/admin/api/work-previews', requireAuth, async (req, res) => {
  try {
    const previews = await WorkPreview.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, previews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/admin/api/work-previews', requireAuth, upload.array('previews', 15), async (req, res) => {
  try {
    const { title, subtitle, link, order, imageUrl } = req.body;
    const createdPreviews = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const preview = new WorkPreview({
          title: title || `Vista Previa ${Date.now() + i}`,
          subtitle: subtitle || '',
          imageUrl: file.path,
          link: link || '',
          order: (parseInt(order) || 0) + i,
        });
        await preview.save();
        createdPreviews.push(preview);
      }
    } else if (imageUrl) {
      const urls = imageUrl.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < urls.length; i++) {
        const preview = new WorkPreview({
          title: title || `Vista Previa ${Date.now() + i}`,
          subtitle: subtitle || '',
          imageUrl: urls[i],
          link: link || '',
          order: (parseInt(order) || 0) + i,
        });
        await preview.save();
        createdPreviews.push(preview);
      }
    } else {
      return res.status(400).json({ success: false, error: 'Se requiere al menos una imagen' });
    }

    res.json({ success: true, previews: createdPreviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/admin/api/work-previews/:id', requireAuth, async (req, res) => {
  try {
    const { title, subtitle, link, order, imageUrl } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (subtitle !== undefined) update.subtitle = subtitle;
    if (link !== undefined) update.link = link;
    if (order !== undefined) update.order = parseInt(order) || 0;
    if (imageUrl) update.imageUrl = imageUrl;

    const preview = await WorkPreview.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, preview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/admin/api/work-previews/:id', requireAuth, async (req, res) => {
  try {
    await WorkPreview.findByIdAndDelete(req.params.id);
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
   404 ERROR HANDLER
══════════════════════════════════════════════════════ */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
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
