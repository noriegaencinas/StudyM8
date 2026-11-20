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
├── app/                    # App móvil (Expo + React Native + TypeScript)
│   ├── src/app/            # Pantallas (rutas de Expo Router)
│   ├── src/components/     # Componentes reutilizables
│   ├── src/lib/            # Cliente de la API, tipos y utilidades
│   ├── app.json            # Configuración de Expo
│   └── package.json
├── backend/                # API (Python + Flask + SQLite)
│   ├── studymate/          # Código del servidor (modelos, rutas, validación)
│   ├── tests/              # Pruebas con pytest
│   ├── run.py              # Arranca el servidor de desarrollo
│   └── requirements.txt
├── docs/
│   └── especificacion.md   # Especificación del proyecto
├── .github/workflows/ci.yml  # Pipeline de CI
├── commitlint.config.mjs   # Reglas de mensajes de commit
├── .env.example            # Variables de entorno necesarias
└── README.md
```

## Requisitos

| Herramienta | Versión |
|---|---|
| [Node.js](https://nodejs.org/) | **22.13 o superior** (LTS recomendado) |
| npm | incluido con Node |
| [Python](https://www.python.org/) | **3.12 o superior** |
| [Expo Go](https://expo.dev/go) | en tu teléfono Android o iOS, para probar la app |
| Git | cualquier versión reciente |

> ⚠️ El proyecto usa **Expo SDK 58** con **Expo Router**. Instala una versión de Expo Go compatible con SDK 58.

## Instalación y ejecución

La app necesita que el backend esté encendido. Usa dos terminales: una para el backend y otra para la app.

### 1. Clonar y configurar variables de entorno

```bash
git clone https://github.com/<tu-usuario>/StudyM8.git
cd StudyM8
cp .env.example backend/.env
```

Edita `backend/.env` y pon tu `AI_API_KEY`. Si no existe `backend/.env`, el backend también lee el `.env` de la raíz.

### 2. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# Windows (Git Bash):    source .venv/Scripts/activate
# macOS / Linux:         source .venv/bin/activate
pip install -r requirements-dev.txt
python run.py
```

El servidor queda en `http://<tu-ip>:5000` y la base de datos se crea sola en `backend/instance/studymate.db`. Comprueba que funciona abriendo `http://localhost:5000/api/health`.

### 3. App (terminal 2)

```bash
cd app
npm install
npm start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iOS). También puedes usar `npm run android`, `npm run ios` o `npm run web`.

La app se conecta sola al backend usando la IP de la computadora que ejecuta `npm start`, así que el teléfono y la computadora deben estar **en la misma red Wi-Fi**. Si el backend está en otra máquina o puerto, define `EXPO_PUBLIC_API_URL` en `app/.env`.

> Si el teléfono no se conecta, revisa que el firewall de Windows permita conexiones entrantes a Python en el puerto 5000 (redes privadas).

## Scripts disponibles

**App** (dentro de `app/`):

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Abre la app en un emulador o dispositivo Android |
| `npm run ios` | Abre la app en el simulador de iOS (requiere macOS) |
| `npm run web` | Abre la app en el navegador |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Valida los tipos de TypeScript (incluidas las rutas) sin compilar |

Para agregar paquetes usa `npx expo install <paquete>` en lugar de `npm install`, así se instala una versión compatible con el SDK de Expo.

**Backend** (dentro de `backend/`, con el entorno virtual activado):

| Comando | Descripción |
|---|---|
| `python run.py` | Inicia el servidor de desarrollo |
| `pytest` | Ejecuta las pruebas |
| `ruff check .` | Ejecuta el linter |
| `ruff format .` | Formatea el código |

## API

Todas las rutas empiezan con `/api` y responden JSON. Los errores tienen la forma `{"error": {"code", "message", "fields"}}`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servidor y de la IA |
| GET, POST | `/subjects` | Listar o crear materias |
| GET, PATCH, DELETE | `/subjects/<id>` | Ver, editar o eliminar una materia (borra también sus apuntes) |
| GET, POST | `/subjects/<id>/notes` | Listar o crear apuntes de una materia |
| GET, PATCH, DELETE | `/notes/<id>` | Ver, editar o eliminar un apunte (y su material de estudio) |
| POST | `/notes/<id>/flashcards/generate` | Generar un borrador de tarjetas con IA (`{"count": 1-20}`) |
| GET, POST | `/notes/<id>/flashcards` | Listar o guardar tarjetas |
| PATCH, DELETE | `/flashcards/<id>` | Editar o eliminar una tarjeta |
| POST | `/flashcards/<id>/review` | Registrar un repaso (`{"known": true}`) |
| POST | `/notes/<id>/quizzes/generate` | Generar un borrador de cuestionario con IA (`{"count": 1-15}`) |
| GET, POST | `/notes/<id>/quizzes` | Listar o guardar cuestionarios |
| GET, DELETE | `/quizzes/<id>` | Ver o eliminar un cuestionario |
| GET, POST | `/quizzes/<id>/attempts` | Historial de intentos, o calificar y guardar uno (`{"answers": [0, 2, null, …]}`) |
| GET | `/progress` | Dominio general y por materia, temas a reforzar e intentos recientes |
| POST | `/notes/<id>/assistant` | Preguntar al asistente (`{"messages": [{"role", "content"}]}`) |

Los endpoints `generate` no guardan nada: devuelven un borrador para que la app muestre el resultado y el estudiante decida si lo guarda.

En `/progress`, el **dominio** de una materia es el promedio del último intento de cada cuestionario (volver a resolver uno reemplaza el resultado anterior). Un tema se marca **para reforzar** cuando sus aciertos en esos últimos intentos están por debajo del 70 %.

## Inteligencia artificial

El backend usa la API de Anthropic con el modelo de `AI_MODEL` (por defecto `claude-sonnet-5-5`). La app nunca habla directo con la IA: siempre pasa por el backend, que guarda la clave.

- **Tarjetas y cuestionarios:** usan salidas estructuradas (esquema JSON) con esfuerzo `medium`. El backend valida cada elemento, descarta los inválidos y mezcla las opciones de cada pregunta.
- **Asistente:** esfuerzo `low` para responder rápido, con el apunte en el prompt del sistema y caché de prompts entre turnos.
- **Respaldo ante rechazos:** las peticiones activan el respaldo del servidor (`fallbacks: "default"`), que reintenta en otro modelo si las salvaguardas de Claude rechazan una petición legítima.
- **Modo simulado:** con `AI_PROVIDER=mock` el backend genera material mecánico a partir del apunte, sin llamar a ninguna API. Lo usan las pruebas y el CI.

## Variables de entorno

Todas están documentadas en [.env.example](.env.example).

| Variable | Dónde | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | app | URL del backend (opcional; se detecta sola) |
| `FLASK_HOST`, `FLASK_PORT` | backend | Interfaz y puerto del servidor |
| `FLASK_DEBUG` | backend | `1` activa recarga automática y depurador |
| `SECRET_KEY` | backend | Clave para firmar sesiones |
| `DATABASE_URL` | backend | Ruta de la base de datos SQLite |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | backend | Configuración del proveedor de IA |
| `CORS_ORIGINS` | backend | Orígenes permitidos (para la versión web) |

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

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `revert`.

## Integración continua

Cada push y Pull Request ejecuta el pipeline de GitHub Actions (`.github/workflows/ci.yml`), que:

1. Valida que los mensajes de commit sigan la convención.
2. App: ejecuta ESLint y valida los tipos de TypeScript.
3. Backend: ejecuta Ruff (lint y formato) y las pruebas con pytest.

Antes de abrir un PR, ejecuta localmente:

```bash
cd app && npm run lint && npm run typecheck
cd ../backend && ruff check . && ruff format --check . && pytest
```

## Tecnologías

| Componente | Tecnología |
|---|---|
| App móvil | Expo SDK 58, Expo Router, React Native, TypeScript |
| Backend | Python, Flask, SQLAlchemy |
| Base de datos | SQLite |
| IA | API de Anthropic (Claude) |
| CI/CD | GitHub Actions |
