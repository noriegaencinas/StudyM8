# StudyMate 📚

Tutor universitario con IA: una app móvil que convierte tus apuntes en tarjetas de memoria, cuestionarios y explicaciones personalizadas, y lleva el seguimiento de tu progreso por materia.

> La especificación completa del proyecto está en [docs/especificacion.md](docs/especificacion.md).

## Funcionalidades

- **Materias y apuntes:** organiza tus apuntes por materia y tema.
- **Tarjetas de memoria con IA:** genera flashcards a partir de tus apuntes.
- **Cuestionarios:** crea cuestionarios personalizados para comprobar lo aprendido.
- **Progreso:** consulta tus resultados anteriores y los temas que necesitas reforzar.
- **Asistente de estudio:** haz preguntas sobre tus apuntes y recibe explicaciones.

## Estructura del repositorio

```
StudyM8/
├── app/                  # App móvil (Expo + React Native + TypeScript)
│   ├── App.tsx           # Pantalla principal
│   ├── app.json          # Configuración de Expo
│   ├── eslint.config.js  # Reglas del linter
│   └── package.json
├── docs/
│   └── especificacion.md # Especificación del proyecto
├── .github/
│   └── workflows/ci.yml  # Pipeline de CI
├── commitlint.config.mjs # Reglas de mensajes de commit
├── .env.example          # Variables de entorno necesarias
└── README.md
```

El backend (Python + Flask) se agregará en una carpeta `backend/` en una etapa posterior.

## Requisitos

| Herramienta | Versión |
|---|---|
| [Node.js](https://nodejs.org/) | **22.13 o superior** (LTS recomendado) |
| npm | incluido con Node |
| [Expo Go](https://expo.dev/go) | en tu teléfono Android o iOS, para probar la app |
| Git | cualquier versión reciente |

> ⚠️ El proyecto usa **Expo SDK 57**. Instala una versión de Expo Go compatible con SDK 57 y usa Node 22.13 o superior (compruébalo con `node -v`).

## Instalación y ejecución

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/<tu-usuario>/StudyM8.git
   cd StudyM8
   ```

2. **Configurar las variables de entorno**

   ```bash
   cp .env.example app/.env
   ```

   Edita `app/.env` y ajusta `EXPO_PUBLIC_API_URL`. Si pruebas en un teléfono físico, usa la IP local de tu computadora (por ejemplo `http://192.168.1.50:5000`) en lugar de `localhost`.

3. **Instalar dependencias**

   ```bash
   cd app
   npm install
   ```

4. **Iniciar la app**

   ```bash
   npm start
   ```

   Escanea el código QR con Expo Go (Android) o con la cámara (iOS). También puedes usar `npm run android`, `npm run ios` o `npm run web`.

## Scripts disponibles

Se ejecutan dentro de `app/`:

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Abre la app en un emulador o dispositivo Android |
| `npm run ios` | Abre la app en el simulador de iOS (requiere macOS) |
| `npm run web` | Abre la app en el navegador |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Valida los tipos de TypeScript sin compilar |

Para agregar paquetes usa `npx expo install <paquete>` en lugar de `npm install`, así se instala una versión compatible con el SDK de Expo.

## Variables de entorno

Todas están documentadas en [.env.example](.env.example).

| Variable | Dónde | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | app | URL del backend |
| `FLASK_ENV`, `FLASK_PORT` | backend | Modo y puerto del servidor |
| `SECRET_KEY` | backend | Clave para firmar sesiones |
| `DATABASE_URL` | backend | Ruta de la base de datos SQLite |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | backend | Configuración del proveedor de IA |
| `CORS_ORIGINS` | backend | Orígenes permitidos |

Las variables con prefijo `EXPO_PUBLIC_` quedan incluidas en la app y cualquiera puede leerlas. Las claves secretas, como `AI_API_KEY`, solo van en el backend.

## Flujo de trabajo con Git

- `main`: versión estable, protegida. Solo se actualiza mediante Pull Request.
- `develop`: rama de integración. Las nuevas funcionalidades se fusionan aquí.
- Ramas de trabajo: `feature/<nombre>`, `fix/<nombre>`, `docs/<nombre>`, creadas desde `develop`.

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>(<alcance opcional>): <descripción>

feat(tarjetas): generar tarjetas desde un apunte
fix(app): corregir el color del título
docs: actualizar instrucciones de instalación
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`.

## Integración continua

Cada push y Pull Request ejecuta el pipeline de GitHub Actions (`.github/workflows/ci.yml`), que:

1. Valida que los mensajes de commit sigan la convención.
2. Ejecuta el linter (ESLint).
3. Valida la sintaxis y los tipos de TypeScript.

Antes de abrir un PR, ejecuta localmente:

```bash
cd app
npm run lint
npm run typecheck
```

## Tecnologías

| Componente | Tecnología |
|---|---|
| App móvil | Expo, React Native, TypeScript |
| Backend | Python, Flask |
| Base de datos | SQLite |
| IA | API de un proveedor de IA |
| CI/CD | GitHub Actions |
