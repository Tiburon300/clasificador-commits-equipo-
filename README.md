# Clasificador de Commits - Equipo

## 1. Descripción

**Clasificador de Commits** es una solución desarrollada para clasificar automáticamente mensajes de commits de Git según categorías convencionales como `feat`, `fix`, `docs`, `test`, `chore` y `refactor`. La solución expone una API REST desarrollada con FastAPI, permite utilizar un motor basado en reglas denominado **ECO** y un motor de inteligencia artificial mediante **Ollama**, y almacena las inferencias realizadas en una base de datos PostgreSQL. El proyecto está diseñado para facilitar la clasificación de commits, comparar diferentes motores de clasificación y mantener un registro histórico de los resultados.

---

## 2. Integrantes y entorno de trabajo

### Integrantes

* **Jeison Felipe Duarte Porras**
* **Daniel Emilio Ramirez Gonzales**

### Perfil de hardware

El desarrollo y las pruebas se realizaron utilizando equipos con Linux y recursos suficientes para ejecutar Docker, PostgreSQL y el modelo local de Ollama.

**Equipo de trabajo principal:**

* Procesador: Intel Core i7-13620H
* Memoria RAM: 16 GB
* Sistema operativo: Linux
* Arquitectura: x86_64

> El modelo utilizado durante las pruebas fue `qwen2.5-coder:1.5b`.

---

## 3. Tecnologías utilizadas

* Python 3.12
* FastAPI
* Uvicorn
* PostgreSQL 16
* Docker
* Docker Compose
* Ollama
* `qwen2.5-coder:1.5b`
* Psycopg2
* Pydantic
* Requests
* Pytest
* Git y GitHub

---

## 4. Requisitos mínimos

### Hardware

Se recomienda como mínimo:

* Procesador de 2 núcleos.
* 8 GB de RAM.
* Al menos 10 GB de espacio libre en disco.
* Conexión a Internet para instalar Docker, Ollama y descargar el modelo.

Para trabajar cómodamente con el modelo local de Ollama se recomienda utilizar:

* 4 o más núcleos.
* 16 GB de RAM.
* Al menos 10 GB de espacio libre adicional para modelos y contenedores.

### Software

Se requiere:

* Linux basado en Ubuntu.
* Git.
* Python 3.
* Docker Engine.
* Docker Compose.
* Ollama.

El proyecto incluye el script `setup.sh`, que automatiza la instalación de varias de estas herramientas.

---

## 5. Instalación

### 5.1 Clonar el repositorio

Desde una terminal de Linux:

```bash
git clone git@github.com:Tiburon300/clasificador-commits-equipo-.git
cd clasificador-commits-equipo-
```

Si se utiliza HTTPS:

```bash
git clone https://github.com/Tiburon300/clasificador-commits-equipo-.git
cd clasificador-commits-equipo-
```

### 5.2 Dar permisos al script de instalación

```bash
chmod +x setup.sh
```

### 5.3 Ejecutar el aprovisionamiento

```bash
./setup.sh
```

El script realiza las siguientes tareas:

* Actualiza los paquetes del sistema.
* Instala utilidades básicas.
* Instala Python, `pip` y `venv`.
* Instala Docker Engine si no está instalado.
* Instala Docker Compose.
* Agrega el usuario actual al grupo `docker`.
* Instala Ollama si no está instalado.

Al finalizar, se debe cerrar y volver a abrir la terminal para que el usuario
pueda utilizar Docker sin `sudo`.

### 5.4 Verificar Docker

Después de volver a abrir la terminal:

```bash
docker --version
```

Y:

```bash
docker compose version
```

También se puede comprobar que Docker funciona:

```bash
docker ps
```

### 5.5 Verificar Ollama

Comprobar que Ollama está instalado:

```bash
ollama --version
```

Consultar los modelos disponibles:

```bash
ollama list
```

Debe estar disponible el modelo:

```text
qwen2.5-coder:1.5b
```

Si todavía no está instalado:

```bash
ollama pull qwen2.5-coder:1.5b
```

Se puede comprobar ejecutándolo:

```bash
ollama run qwen2.5-coder:1.5b
```

Para salir del modelo:

```text
/bye
```

### 5.6 Configurar las variables de entorno

Entrar al directorio del proyecto:

```bash
cd proyecto-ia
```

Crear el archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Editar el archivo:

```bash
nano .env
```

Utilizar una configuración equivalente a:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iadb
DB_USER=app_ia
DB_PASSWORD=CAMBIAR_POR_LA_CONTRASEÑA_REAL
DB_ADMIN_PASSWORD=CAMBIAR_POR_LA_CONTRASEÑA_DEL_ADMINISTRADOR


OLLAMA_URL=http://localhost:11434/api/generate
MODELO_OLLAMA=qwen2.5-coder:1.5b
MOTOR_POR_DEFECTO=eco
```

Las contraseñas deben ser reemplazadas por las credenciales configuradas para
PostgreSQL.

**No se debe subir el archivo ****`.env`**** a GitHub.**

El archivo `.env.example` no contiene contraseñas reales y sirve como plantilla.

### 5.7 Levantar la solución

Desde la carpeta `proyecto-ia`:

```bash
docker compose up -d
```

Esto inicia:

* PostgreSQL.
* La API FastAPI.

Para comprobar los contenedores:

```bash
docker compose ps
```

Los servicios principales son:

```text
db
api
```

### 5.8 Ver los registros de los servicios

Para revisar los registros:

```bash
docker compose logs
```

Para revisar únicamente la API:

```bash
docker compose logs api
```

Para revisar PostgreSQL:

```bash
docker compose logs db
```

---

## 6. Verificación de funcionamiento

### 6.1 Verificar los contenedores

Ejecutar:

```bash
docker compose ps
```

Los servicios deben aparecer activos.

### 6.2 Verificar el estado de la API

Ejecutar:

```bash
curl http://localhost:8000/health
```

Respuesta esperada:

```json
{
  "estado": "ok",
  "base_datos": "ok"
}
```

También se puede acceder a la documentación interactiva de FastAPI desde:

```text
http://localhost:8000/docs
```

---

## 7. Prueba de los endpoints

La API dispone de tres endpoints principales.

### 7.1 GET /health

Comprueba que la API y la conexión con PostgreSQL funcionan correctamente.

```bash
curl http://localhost:8000/health
```

Respuesta esperada:

```json
{
  "estado": "ok",
  "base_datos": "ok"
}
```

Código esperado:

```text
200 OK
```

Si PostgreSQL no está disponible:

```text
503 Service Unavailable
```

---

### 7.2 POST /clasificar

Clasifica un mensaje de commit.

Ejemplo utilizando el motor ECO:

```bash
curl -X POST http://localhost:8000/clasificar \
  -H "Content-Type: application/json" \
  -d '{"texto":"corrige el error de conexion a la base de datos","motor":"eco"}'
```

Respuesta esperada:

```json
{
  "motor": "eco",
  "modelo": "reglas-v1",
  "entrada": "corrige el error de conexion a la base de datos",
  "tipo": "fix",
  "latencia_ms": 0
}
```

La latencia puede variar dependiendo del equipo y del motor utilizado.

También se puede probar el motor Ollama:

```bash
curl -X POST http://localhost:8000/clasificar \
  -H "Content-Type: application/json" \
  -d '{"texto":"agrega pruebas para el modulo de usuarios","motor":"ollama"}'
```

El resultado debe indicar el motor, modelo, mensaje de entrada, categoría
detectada y latencia.

### 7.3 GET /inferencias

Permite consultar las últimas inferencias almacenadas en PostgreSQL.

```bash
curl http://localhost:8000/inferencias
```

También se puede especificar la cantidad de registros:

```bash
curl "http://localhost:8000/inferencias?limite=10"
```

La respuesta contiene información como:

```json
[
  {
    "id": 1,
    "fecha": "2026-08-17T16:00:00",
    "motor": "eco",
    "modelo": "reglas-v1",
    "entrada": "corrige el error de conexion",
    "salida": "fix",
    "latencia_ms": 0
  }
]
```

---

## 8. Solución de problemas

### Problema 1: permiso denegado al utilizar Docker

Durante la configuración se presentó un error relacionado con los permisos
para acceder al socket de Docker:

```text
permission denied while trying to connect to the Docker API
```

**Causa:** el usuario no tenía permisos para comunicarse con Docker.

**Solución:** agregar el usuario al grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Después se debe cerrar y volver a abrir la sesión o la terminal.

Se puede verificar con:

```bash
docker ps
```

---

### Problema 2: Docker Compose no encontraba correctamente los servicios

Durante el trabajo fue necesario ejecutar los comandos desde la ubicación
correcta del archivo `docker-compose.yml`.

**Causa:** el archivo `docker-compose.yml` se encuentra dentro de:

```text
proyecto-ia/
```

**Solución:**

```bash
cd proyecto-ia
docker compose up -d
```

También se puede especificar directamente el archivo:

```bash
docker compose -f proyecto-ia/docker-compose.yml up -d
```

---

### Problema 3: configuración de variables de entorno

La aplicación requiere variables de entorno para conectarse a PostgreSQL y
configurar Ollama.

**Causa:** las variables deben estar disponibles para el contenedor de la API.

**Solución:** crear el archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

y completar las variables necesarias.

Las credenciales reales no deben almacenarse en el código fuente ni subirse
a GitHub.

---

### Problema 4: prueba de Ollama y disponibilidad del modelo

Durante las pruebas fue necesario comprobar que Ollama estuviera instalado y
que el modelo utilizado estuviera disponible.

**Solución:**

Comprobar Ollama:

```bash
ollama --version
```

Comprobar modelos:

```bash
ollama list
```

Descargar el modelo cuando sea necesario:

```bash
ollama pull qwen2.5-coder:1.5b
```

La API utiliza:

```text
qwen2.5-coder:1.5b
```

---

### Problema 5: rechazo de Git al realizar `push`

Durante el trabajo se produjo un rechazo al intentar subir cambios a la rama:

```text
! [rejected] feat/contenerizacion-jeison -> feat/contenerizacion-jeison
(fetch first)
```

**Causa:** la rama remota contenía cambios que todavía no estaban presentes
en la copia local.

**Solución:** actualizar la rama local mediante `pull --rebase`:

```bash
git pull --rebase origin feat/contenerizacion-jeison
```

Después se puede volver a realizar el `push`:

```bash
git push origin feat/contenerizacion-jeison
```

---

### Problema 6: restauración del respaldo de PostgreSQL

Durante la prueba de respaldo se vació la tabla `inferencias` y posteriormente
se restauró el archivo SQL.

Al restaurar aparecieron mensajes como:

```text
ERROR: relation "inferencias" already exists
```

y:

```text
ERROR: multiple primary keys for table "inferencias" are not allowed
```

**Causa:** la estructura de la tabla ya existía en la base de datos durante la
restauración.

Sin embargo, los registros fueron restaurados correctamente. La salida mostró:

```text
COPY 1299
```

y posteriormente:

```text
count
-------
1299
```

Esto confirmó que los 1299 registros originales fueron recuperados.

---

## 9. Respaldo de la base de datos

Para crear un respaldo:

```bash
mkdir -p backups
```

```bash
docker compose exec -T db pg_dump -U postgres iadb > backups/respaldo_$(date +%F).sql
```

Comprobar el archivo:

```bash
ls -lh backups/
```

Para restaurarlo:

```bash
cat backups/respaldo_$(date +%F).sql | docker compose exec -T db psql -U postgres -d iadb
```

Se recomienda realizar y probar periódicamente los respaldos.

---

## 10. Estructura principal del proyecto

```text
clasificador-commits-equipo-/
├── .github/
├── diagnostico.sh
├── setup.sh
├── README.md
└── proyecto-ia/
    ├── app/
    │   └── main.py
    ├── backups/
    ├── db/
    │   └── init.sql
    ├── docs/
    │   └── manual-tecnico.md
    ├── .env
    ├── .env.example
    ├── Dockerfile
    ├── docker-compose.yml
    └── requirements.txt
```

> El archivo `.env` contiene información sensible y no debe publicarse en el
> repositorio.

---

## 11. Documentación técnica

El manual técnico de la solución se encuentra en:

```text
proyecto-ia/docs/manual-tecnico.md
```

El documento contiene información sobre:

* Arquitectura.
* Seguridad.
* Endpoints.
* Modelo de datos.
* Respaldo y restauración.
* Decisiones de diseño.
* Limitaciones conocidas.
* Mantenimiento.

---

## 12. Video de demostración

El video de demostración correspondiente a la actividad de transferencia se
encuentra pendiente de publicación.

**Enlace:** pendiente.

Una vez publicado, reemplazar esta sección por el enlace correspondiente.

---

## 13. Licencia

Proyecto académico desarrollado como parte de las actividades de formación.
