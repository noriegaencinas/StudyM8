# Especificación del proyecto: StudyMate

## 1. Objetivo de la aplicación

StudyMate es una aplicación móvil diseñada para ayudar a los estudiantes a organizar sus materias y estudiar de una manera más sencilla. La aplicación permitirá guardar apuntes, crear tarjetas de memoria y generar cuestionarios utilizando inteligencia artificial.

La idea es que el estudiante pueda aprovechar sus propios apuntes para repasar los temas que está aprendiendo, practicar con preguntas y revisar su progreso. De esta manera, tendrá varias herramientas de estudio en un solo lugar, sin necesidad de crear manualmente todo el material.

## 2. Funcionalidades principales

### 2.1. Organización de materias y apuntes

El usuario podrá crear materias y guardar apuntes relacionados con cada una. Esto permitirá tener la información organizada y encontrar fácilmente el material que necesita para estudiar.

### 2.2. Generación de tarjetas de memoria con IA

La aplicación podrá utilizar inteligencia artificial para crear tarjetas de memoria a partir de los apuntes del usuario. Cada tarjeta tendrá una pregunta o concepto por un lado y su respuesta o explicación por el otro.

Estas tarjetas servirán para repasar conceptos importantes y practicar la memoria.

### 2.3. Generación de cuestionarios

StudyMate permitirá crear cuestionarios a partir del material de estudio. La IA propondrá preguntas y respuestas para que el usuario pueda comprobar cuánto ha aprendido.

### 2.4. Registro de resultados y progreso

La aplicación guardará los resultados de los cuestionarios y mostrará información básica sobre el progreso del estudiante. Por ejemplo, podrá consultar sus puntuaciones anteriores y observar en qué temas necesita practicar más.

### 2.5. Asistente de estudio con IA

Se incluirá una función para ayudar al usuario a comprender mejor sus apuntes. Podrá hacer preguntas sobre el contenido y recibir explicaciones relacionadas con el material proporcionado.

## 3. Integración con inteligencia artificial, agentes y MCP

StudyMate utilizará inteligencia artificial para convertir los apuntes del usuario en material de estudio y ofrecer explicaciones sobre los temas que está aprendiendo.

La integración se realizará mediante una API de IA. La aplicación enviará el texto seleccionado por el usuario a un servidor propio, que se encargará de comunicarse con el proveedor de inteligencia artificial y devolver el resultado a la app.

Esto permitirá mantener las claves de acceso protegidas y controlar qué información se envía al servicio externo.

### Uso de agentes

En una primera versión, no será necesario implementar un agente autónomo complejo. Las funciones de IA responderán a solicitudes concretas del usuario, como generar tarjetas, crear un cuestionario o explicar un concepto.

Más adelante, se podría incorporar un agente de estudio que ayude a preparar sesiones de repaso, recomiende qué temas practicar y organice actividades según los resultados obtenidos.

### Uso de MCP

MCP (Model Context Protocol) es una forma de conectar modelos de inteligencia artificial con herramientas y fuentes de información mediante una estructura común.

En la primera versión de StudyMate, MCP será opcional y no será necesario para las funciones principales. En futuras versiones podría utilizarse para permitir que un asistente de IA consulte herramientas de la aplicación, como las materias, los apuntes o los resultados de estudio, siempre con los permisos correspondientes.

## 4. Arquitectura básica

La aplicación tendrá una estructura sencilla, separando la interfaz móvil, el servidor y los servicios externos.

### Componentes principales

- **Aplicación móvil:** Se desarrollará con Expo y React Native. Será la parte con la que interactuará el usuario, desde donde podrá organizar sus materias, consultar apuntes y utilizar las funciones de estudio.
- **Backend:** Será un servidor propio que recibirá las solicitudes de la aplicación, gestionará la lógica necesaria y se comunicará con la API de inteligencia artificial.
- **Base de datos:** Guardará la información necesaria para el funcionamiento de la aplicación, como materias, apuntes y resultados de cuestionarios.
- **Servicio de inteligencia artificial:** Se encargará de generar tarjetas, cuestionarios y explicaciones a partir del contenido enviado.
- **Repositorio y pipeline CI/CD:** GitHub se utilizará para guardar el código y controlar sus versiones. Un pipeline automático comprobará que los cambios cumplan ciertas reglas antes de integrarlos en el proyecto.

### Flujo básico de funcionamiento

1. El usuario abre StudyMate y selecciona una materia o unos apuntes.
2. Elige la función que quiere utilizar, por ejemplo, generar tarjetas de memoria.
3. La aplicación envía la solicitud al backend.
4. El backend prepara la petición y la envía al servicio de inteligencia artificial.
5. La IA devuelve el contenido generado.
6. El backend entrega el resultado a la aplicación, que lo muestra al usuario y permite guardarlo si así lo desea.

### Tecnologías propuestas

| Componente | Tecnología |
|---|---|
| Aplicación móvil | Expo y React Native |
| Lenguaje principal de la app | TypeScript |
| Backend | Python con Flask |
| Base de datos | SQLite para el prototipo; otra opción podrá evaluarse si se necesita sincronización entre dispositivos |
| Inteligencia artificial | API de un proveedor de IA |
| Control de versiones | Git y GitHub |
| Automatización de pruebas | GitHub Actions |

Estas tecnologías son una propuesta inicial y podrán ajustarse durante el desarrollo. La primera versión se centrará en las funciones esenciales para mantener el proyecto manejable y permitir futuras mejoras.
