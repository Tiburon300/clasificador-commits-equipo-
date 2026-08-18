# Manual técnico

## 1. Arquitectura

La solución está compuesta por un cliente, una API desarrollada con FastAPI,
dos motores de clasificación y una base de datos PostgreSQL.

```text
┌──────────────────────┐
│       Cliente        │
│ Navegador / Swagger  │
└──────────┬───────────┘
           │ HTTP :8000
           ▼
┌──────────────────────┐
│      FastAPI         │
│      API REST        │
│      :8000           │
└──────────┬───────────┘
           │
           ├──────────────────────┐
           ▼                      ▼
┌──────────────────┐    ┌──────────────────────┐
│   Motor ECO      │    │    Motor Ollama      │
│   reglas-v1      │    │ qwen2.5-coder:1.5b   │
└────────┬─────────┘    └──────────┬───────────┘
         │                          │
         │                          │ HTTP :11434
         │                          ▼
         │                 ┌──────────────────┐
         │                 │      Ollama      │
         │                 │     :11434       │
         │                 └──────────────────┘
         │
         └──────────────┐
                        ▼
               ┌──────────────────┐
               │   PostgreSQL     │
               │      :5432       │
               │       iadb       │
               └──────────────────┘

## 2. Seguridad

### Puertos expuestos

- **Puerto 8000:** utilizado por FastAPI para permitir el acceso a la API.
- **Puerto 11434:** utilizado por Ollama para las solicitudes de inferencia.
- **Puerto 5432:** utilizado por PostgreSQL para las conexiones a la base de datos.

Estos puertos se exponen porque son necesarios para la comunicación entre
los diferentes componentes de la solución.

### Roles de la base de datos

Se utiliza el usuario administrador `postgres` para las tareas administrativas
de PostgreSQL.

La aplicación utiliza el usuario:

`app_ia`

Este usuario tiene privilegios mínimos:

- Puede conectarse a la base de datos `iadb`.
- Puede utilizar el esquema `public`.
- Puede consultar la tabla `inferencias`.
- Puede insertar registros en la tabla `inferencias`.
- Puede utilizar la secuencia de la tabla `inferencias`.

La aplicación no debe conectarse utilizando el usuario administrador.

### Manejo de secretos

Las credenciales se almacenan en el archivo `.env`.

Este archivo está incluido en `.gitignore`, por lo que no se sube al
repositorio de GitHub.

El archivo `.env.example` contiene únicamente los nombres de las variables
necesarias, sin las contraseñas reales.

### ¿Qué hacer si se filtra una contraseña?

Si una contraseña se filtra, se debe:

1. Cambiar inmediatamente la contraseña comprometida.
2. Actualizar la contraseña en el archivo `.env`.
3. Actualizar la credencial en el servicio correspondiente.
4. Revisar los registros para detectar posibles accesos no autorizados.
5. Si la contraseña fue publicada en Git, generar una nueva credencial y
   tomar medidas para eliminar el secreto expuesto del historial cuando sea
   necesario.
6. Evitar almacenar contraseñas directamente en el código fuente.

## Endpoints de la API

| Método | Ruta | Parámetros de Entrada | Respuesta Esperada | Códigos de Error |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Ninguno | `{"estado":"ok","base_datos":"conectada"}` | `500 Internal Server Error` |
| `POST` | `/clasificar` | `JSON`: `{"texto": "str", "motor": "eco\|ollama"}` | `JSON`: `{"id": int, "tipo": "str", "motor": "str", ...}` | `400 Bad Request`, `422 Unprocessable` |
| `GET` | `/inferencias` | Ninguno | `JSON`: Lista con el historial de clasificaciones | `500 Internal Server Error` |

---

## Modelo de Datos

Estructura técnica de la tabla `public.inferencias` en PostgreSQL (`iadb`):

| Campo | Tipo de Dato | Nulable | Valor por Defecto / Llave | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `integer` | `not null` | `PRIMARY KEY`, `nextval('inferencias_id_seq'::regclass)` | Identificador único autoincremental de la inferencia. |
| `fecha` | `timestamp without time zone` | `not null` | `now()` | Fecha y hora exacta en que se registró la inferencia. |
| `motor` | `character varying(20)` | `not null` | N/A | Motor utilizado para procesar la petición (`eco` u `ollama`). |
| `modelo` | `character varying(120)` | `not null` | N/A | Versión o nombre del modelo/regla aplicada. |
| `entrada` | `text` | `not null` | N/A | Mensaje de commit o texto enviado para clasificar. |
| `salida` | `text` | `not null` | N/A | Resultado de la clasificación devuelto por el motor. |
| `latencia_ms` | `integer` | `not null` | N/A | Tiempo de ejecución de la inferencia expresado en milisegundos. |

---

## Decisiones de Diseño y Limitaciones

### Decisiones de Arquitectura
* **Dockerfile Multi-Etapa:** Minimiza el tamaño de la imagen final y elimina herramientas de compilación en el entorno de producción, optimizando seguridad y tiempos de despliegue.
* **Usuario sin Privilegios en Contenedor:** La aplicación se ejecuta bajo un usuario sin permisos de superusuario dentro del contenedor para mitigar vectores de ataque y escalación de privilegios en el host.
* **Privilegios Mínimos en Base de Datos:** El rol asignado a la API (`app_ia`) cuenta únicamente con privilegios `SELECT` e `INSERT` sobre la tabla `inferencias`, previniendo modificaciones no autorizadas o borrados de datos (`DROP`/`DELETE`).
* **Inclusión del Motor Eco:** Ofrece una alternativa ligera y determinista con tiempos de respuesta ultra bajos (~17 ms), ideal para pruebas continuas y contingencias cuando el servicio de LLM no está disponible.

### Limitaciones Conocidas
* **Latencia del Motor Ollama:** El cómputo del modelo de lenguaje local requiere una carga alta de CPU/VRAM, generando tiempos de respuesta de ~800 ms a 4500 ms en la primera petición (*cold-start*).
* **Concurrencia Secuencial:** El servicio local de Ollama procesa las inferencias secuencialmente por defecto, lo que puede provocar encolamiento ante ráfagas de tráfico simultáneo.
* **Persistencia en Nodo Local:** Los datos residen en un volumen de Docker administrado en el host, haciendo indispensable la ejecución periódica del plan de respaldo documentado para garantizar la recuperación ante desastres.
