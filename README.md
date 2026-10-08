# GaboDev — Portafolio Personal

Portafolio personal de **Gabriel Leandro Reina (GaboDev)**, Programador Web y Desarrollador de Software Full Stack.  
Disponible en produccion: [portafolio-gabo-dev.vercel.app](https://portafolio-gabo-dev.vercel.app)

---

## Descripcion del Proyecto

Sitio web de portafolio con estetica inspirada en Metal Gear Solid, modo oscuro/claro, animaciones y un panel de administracion para gestionar proyectos dinamicamente. El backend sirve los proyectos desde MongoDB y permite subir archivos multimedia a Cloudinary.

---

## Tecnologias Utilizadas

### Frontend
- HTML5, CSS3 (Vanilla, sin frameworks)
- JavaScript (Vanilla)
- Google Fonts: Bebas Neue, Share Tech Mono, Rajdhani, Barlow Condensed
- Font Awesome 6

### Backend
- Node.js con Express
- MongoDB + Mongoose
- Sesiones con `express-session` + `connect-mongo`
- Subida de archivos con Multer + Cloudinary
- Motor de plantillas EJS (panel admin)

### Infraestructura y despliegue
- Vercel (produccion, modo serverless)
- Variables de entorno via `.env`

---

## Estructura del Proyecto

```
PortafolioGaboDev/
├── public/
│   ├── index.html          # Pagina principal del portafolio
│   ├── styles.css          # Estilos globales
│   ├── main.js             # Logica del frontend
│   ├── img/                # Imagenes del sitio
│   └── admin/
│       ├── index.html      # Panel de administracion
│       └── login.html      # Login del admin
├── views/                  # Plantillas EJS (si aplica)
├── server.js               # Servidor Express + API REST
├── package.json
├── vercel.json             # Configuracion de despliegue en Vercel
├── CV.pdf                  # Curriculum Vitae descargable
└── .gitignore
```

---

## Caracteristicas Principales

- Modo oscuro / claro con persistencia
- Animaciones de entrada, glitch effects y HUD decorativos
- Portafolio dinamico: los proyectos se cargan desde la API
- Filtros por categoria: Programacion, Desarrollo Web, Diseno, Video
- Modal de detalle por proyecto con imagen/video, tags y links
- Formulario de contacto
- Descarga directa del CV desde la ruta `/cv`
- Panel de administracion protegido por sesion
- CRUD completo de proyectos (crear, editar, eliminar, reordenar)
- Soporte para imagenes y videos en Cloudinary
- Diseno responsive

---

## Variables de Entorno

Crear un archivo `.env` en la raiz del proyecto con las siguientes variables:

```env
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=tu_secreto_de_sesion
ADMIN_USER=usuario_admin
ADMIN_PASS=contrasena_admin
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## Instalacion y Uso Local

```bash
# Clonar el repositorio
git clone https://github.com/GaboDev24/PortafolioGaboDev.git
cd PortafolioGaboDev

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# (editar .env con los datos reales)

# Iniciar en modo desarrollo
npm run dev

# O iniciar en modo produccion
npm start
```

El servidor queda disponible en `http://localhost:3000`.

---

## API REST (Publica)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/projects` | Todos los proyectos (filtrable por `?category=web`) |
| GET | `/api/projects/featured` | Proyectos destacados |
| GET | `/cv` | Descargar CV en PDF |

---

## Panel de Administracion

Ruta: `/admin/login`

El panel permite gestionar el portafolio completo:
- Crear, editar y eliminar proyectos
- Subir imagen o video por proyecto
- Marcar proyectos como destacados
- Controlar el orden de aparicion

El acceso esta protegido por usuario y contrasena definidos en las variables de entorno.

---

## Despliegue en Vercel

El proyecto esta configurado para correr en Vercel como funcion serverless. El archivo `vercel.json` redirige todas las rutas al servidor Express.

```bash
vercel --prod
```

---

## Sobre el Autor

**Gabriel Leandro Reina**  
Mendoza, Argentina — Disponible para trabajo remoto

Programador web y desarrollador de software orientado a la resolucion de problemas y a la construccion de soluciones practicas y escalables. Con experiencia en Python, JavaScript, TypeScript, SQL y Node.js, tanto en frontend como en backend.

Actualmente cursando Desarrollador de Software en Instituto Nuevo Cuyo (INCUYO) y ejerciendo como Ayudante de Catedra, Prompt Engineer y QA Tester.

**Experiencia profesional:**
- Freelance — Desarrollador Web (2022 — actualidad)
- Freelance — Prompt Engineer (2025 — actualidad)
- Freelance — Profesor Particular de Programacion (Mayo 2026 — actualidad)
- Spider-Web ARG — Fundador y Desarrollador (2023 — actualidad)
- Instituto Nuevo Cuyo — Desarrollador Web y Ayudante de Catedra (Marzo 2026 — actualidad)
- Spider-Web ARG / INCUYO — QA Tester (Enero 2026 — actualidad)

**Contacto:**
- gabrielreina052@gmail.com
- GitHub: [GaboDev24](https://github.com/GaboDev24)
- Instagram: [@gabodev24](https://www.instagram.com/gabodev24/)
- Portafolio: [portafolio-gabo-dev.vercel.app](https://portafolio-gabo-dev.vercel.app)

---

## Licencia

Proyecto personal. Todos los derechos reservados — Gabriel Leandro Reina (GaboDev) 2026.
