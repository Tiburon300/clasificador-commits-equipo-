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
