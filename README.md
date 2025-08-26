# whr_casig_admin_front

Frontend del sistema de asignacion de cartas (CASIG) 

## 🚀 Tecnologías utilizadas

- [Svelte](https://svelte.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PapaParse](https://www.papaparse.com/) (para leer CSVs)

## 📂 Estructura del proyecto
GTIM_PORTAL_FRONTEND/
├── .vscode/ # Configuración de VS Code
├── node_modules/ # Dependencias (ignorado por Git)
├── public/ # Archivos públicos y CSV fijos
├── src/
│ ├── assets/ # Imágenes, íconos, etc.
│ ├── lib/ # Funciones auxiliares y lógicas compartidas
│ ├── pages/ # Pantallas principales
│ │ ├── CargaCSV.svelte
│ │ ├── ConsultaDispositivos.svelte
│ │ └── ConsultaUsuarios.svelte
│ ├── App.svelte # Componente raíz
│ ├── app.css # Estilos base
│ ├── main.ts # Punto de entrada de la app
│ ├── style.css # Estilos adicionales
│ ├── routes.ts # Archivo de rutas (si aplica)
│ └── vite-env.d.ts # Tipado de entorno
├── index.html # HTML principal
├── package.json # Configuración del proyecto
├── package-lock.json # Lockfile de dependencias
├── postcss.config.cjs # Configuración de PostCSS
├── svelte.config.js # Configuración de Svelte
├── tailwind.config.cjs # Configuración de Tailwind
├── tsconfig.json # Configuración de TypeScript
├── tsconfig.app.json # Configuración TS para el app
├── README.md # Este archivo
└── .gitignore # Archivos ignorados por Git

## 🛠️ Instalación

# Clona el repositorio
git clone https://github.com/grupotimx/whr_casig_admin_front.git

# Entra al proyecto
cd whr_casig_admin_front

# Instala dependencias
npm install

# Inicia el servidor
npm run dev
