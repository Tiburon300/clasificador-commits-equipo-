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
```

### Componentes

* **Cliente:** permite interactuar con la API mediante un navegador o Swagger UI.
* **FastAPI:** proporciona la API REST y recibe las solicitudes de clasificación.
* **Motor ECO:** clasifica los mensajes utilizando reglas basadas en expresiones regulares. Utiliza el modelo lógico `reglas-v1`.
* **Motor Ollama:** utiliza un modelo de lenguaje local para realizar la clasificación.
* **Ollama:** proporciona el servicio de inferencia utilizado por el motor Ollama a través del puerto 11434.
* **PostgreSQL:** almacena las inferencias realizadas por la aplicación en la base de datos `iadb`.

El flujo principal es:

1. El cliente envía una solicitud HTTP a FastAPI.
2. FastAPI recibe el mensaje de commit.
3. Se selecciona el motor `eco` u `ollama`.
4. El motor clasifica el mensaje.
5. La aplicación registra la inferencia en PostgreSQL.
6. FastAPI devuelve el resultado al cliente.

---

## 2. Seguridad

### Puertos expuestos

* **Puerto 8000:** utilizado por FastAPI para permitir el acceso a la API.
* **Puerto 11434:** utilizado por Ollama para las solicitudes de inferencia.
* **Puerto 5432:** utilizado por PostgreSQL para las conexiones a la base de datos.

Estos puertos son necesarios para la comunicación entre los diferentes
componentes de la solución.

### Roles de la base de datos

Se utiliza el usuario administrador `postgres` para las tareas administrativas
de PostgreSQL.

La aplicación utiliza el usuario:

`app_ia`

Este usuario tiene privilegios mínimos:

* Puede conectarse a la base de datos `iadb`.
* Puede utilizar el esquema `public`.
* Puede consultar la tabla `inferencias`.
* Puede insertar registros en la tabla `inferencias`.
* Puede utilizar la secuencia asociada a la tabla `inferencias`.

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

---

## 3. Endpoints

La API proporciona tres endpoints principales: `/health`, `/clasificar` e
`/inferencias`.

### 3.1 GET /health

Permite comprobar si la API está funcionando y si existe conexión con
PostgreSQL.

**Método:** `GET`

**Ruta:**

```text
/health
```

**Parámetros:** ninguno.

**Respuesta exitosa:**

```json
{
  "estado": "ok",
  "base_datos": "ok"
}
```

**Código de respuesta:**

* `200 OK`: servicio y base de datos disponibles.
* `503 Service Unavailable`: la base de datos no está disponible.

---

### 3.2 POST /clasificar

Clasifica un mensaje de commit utilizando el motor seleccionado y registra
la inferencia en PostgreSQL.

**Método:** `POST`

**Ruta:**

```text
/clasificar
```

**Parámetros de entrada:**

| Campo   | Tipo   | Obligatorio | Descripción                                                                                                            |
| ------- | ------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `texto` | string | Sí          | Mensaje del commit que se desea clasificar.                                                                            |
| `motor` | string | No          | Motor utilizado. Puede ser `eco` u `ollama`. Si no se especifica, se utiliza el motor configurado como predeterminado. |

**Ejemplo de solicitud:**

```json
{
  "texto": "corrige el error de conexion a la base de datos",
  "motor": "eco"
}
```

**Respuesta exitosa:**

```json
{
  "motor": "eco",
  "modelo": "reglas-v1",
  "entrada": "corrige el error de conexion a la base de datos",
  "tipo": "fix",
  "latencia_ms": 0
}
```

La latencia puede variar dependiendo del motor utilizado y de las condiciones
del sistema.

**Códigos de respuesta:**

* `200 OK`: clasificación realizada correctamente.
* `400 Bad Request`: se indicó un motor diferente de `eco` u `ollama`.
* `422 Unprocessable Entity`: los datos enviados no cumplen con el modelo de
  entrada esperado por FastAPI/Pydantic.
* `500 Internal Server Error`: error interno durante el procesamiento o
  almacenamiento de la inferencia.

---

### 3.3 GET /inferencias

Devuelve las últimas inferencias registradas en la base de datos.

**Método:** `GET`

**Ruta:**

```text
/inferencias
```

**Parámetro de entrada:**

| Parámetro | Tipo    | Obligatorio | Valor predeterminado | Descripción                                             |
| --------- | ------- | ----------- | -------------------- | ------------------------------------------------------- |
| `limite`  | integer | No          | `20`                 | Cantidad máxima de inferencias que se desean consultar. |

**Ejemplo:**

```text
/inferencias?limite=10
```

**Respuesta:**

```json
[
  {
    "id": 1299,
    "fecha": "2026-08-17T...",
    "motor": "eco",
    "modelo": "reglas-v1",
    "entrada": "corrige el error de conexion",
    "salida": "fix",
    "latencia_ms": 0
  }
]
```

**Códigos de respuesta:**

* `200 OK`: consulta realizada correctamente.
* `422 Unprocessable Entity`: el parámetro `limite` no tiene un formato de
  entero válido.
* `500 Internal Server Error`: error durante la conexión o consulta de la
  base de datos.

### Resumen de endpoints

| Método | Ruta           | Entrada principal | Función                                         |
| ------ | -------------- | ----------------- | ----------------------------------------------- |
| `GET`  | `/health`      | Ninguna           | Verificar estado de la API y conexión con BD.   |
| `POST` | `/clasificar`  | `texto`, `motor`  | Clasificar un commit y registrar la inferencia. |
| `GET`  | `/inferencias` | `limite` opcional | Consultar las últimas inferencias.              |

---

## 4. Modelo de datos

La información de las inferencias se almacena en la tabla
`public.inferencias` de PostgreSQL.

### Estructura de la tabla

| Campo         | Tipo                        | Nulo | Valor predeterminado           | Descripción                                                                            |
| ------------- | --------------------------- | ---- | ------------------------------ | -------------------------------------------------------------------------------------- |
| `id`          | integer                     | No   | Secuencia `inferencias_id_seq` | Identificador único de la inferencia.                                                  |
| `fecha`       | timestamp without time zone | No   | `now()`                        | Fecha y hora en que se registra la inferencia.                                         |
| `motor`       | varchar(20)                 | No   | —                              | Motor utilizado para clasificar el mensaje (`eco` u `ollama`).                         |
| `modelo`      | varchar(120)                | No   | —                              | Modelo o conjunto de reglas utilizado durante la clasificación.                        |
| `entrada`     | text                        | No   | —                              | Mensaje de commit recibido por la API.                                                 |
| `salida`      | text                        | No   | —                              | Categoría obtenida como resultado de la clasificación.                                 |
| `latencia_ms` | integer                     | No   | —                              | Tiempo aproximado utilizado para realizar la clasificación, expresado en milisegundos. |

La columna `id` es la clave primaria de la tabla y utiliza la secuencia
`inferencias_id_seq` para generar los identificadores.

Las categorías utilizadas por el clasificador son:

* `feat`
* `fix`
* `docs`
* `test`
* `chore`
* `refactor`

El motor ECO utiliza el modelo lógico `reglas-v1`, mientras que el motor
Ollama utiliza el modelo de lenguaje configurado en `MODELO_OLLAMA`.

---

## 5. Respaldo y restauración

Se utiliza `pg_dump` para generar respaldos de la base de datos PostgreSQL.

### 5.1 Crear el directorio de respaldos

```bash
mkdir -p backups
```

### 5.2 Crear el respaldo

El respaldo se genera mediante:

```bash
docker compose exec -T db pg_dump -U postgres iadb > backups/respaldo_$(date +%F).sql
```

El archivo se guarda en el directorio `backups` utilizando la fecha actual
como parte de su nombre.

### 5.3 Verificar el archivo

Se puede comprobar que el archivo fue creado mediante:

```bash
ls -lh backups/
```

En la prueba realizada se generó:

```text
respaldo_2026-08-17.sql
```

con un tamaño aproximado de 110 KB.

### 5.4 Comprobar los datos antes de la prueba

Se verificó la cantidad de registros existentes:

```bash
docker compose exec -T db psql -U postgres -d iadb -c "SELECT COUNT(*) FROM inferencias;"
```

Resultado:

```text
 count
-------
  1299
```

### 5.5 Simular la pérdida de información

Para comprobar que el respaldo puede recuperar los datos, se vació la tabla:

```bash
docker compose exec -T db psql -U postgres -d iadb -c "TRUNCATE inferencias;"
```

Posteriormente se verificó que la tabla no tuviera registros:

```text
 count
-------
     0
```

### 5.6 Restaurar el respaldo

El archivo generado se restauró mediante:

```bash
cat backups/respaldo_$(date +%F).sql | docker compose exec -T db psql -U postgres -d iadb
```

Durante la restauración se mostraron algunos mensajes relacionados con objetos
que ya existían en la base de datos, debido a que la estructura de la tabla
no había sido eliminada previamente. Sin embargo, la operación restauró
correctamente los registros.

La salida incluyó:

```text
COPY 1299
```

lo que indica que fueron cargados 1299 registros.

### 5.7 Verificar la restauración

Finalmente se ejecutó:

```bash
docker compose exec -T db psql -U postgres -d iadb -c "SELECT COUNT(*) FROM inferencias;"
```

Resultado:

```text
 count
-------
 1299
```

### Resultado de la prueba

La prueba de respaldo y restauración fue exitosa:

```text
1299 registros
      ↓
Crear respaldo
      ↓
0 registros
      ↓
Restaurar respaldo
      ↓
1299 registros recuperados
```

Esto demuestra que el archivo de respaldo permitió recuperar los registros de
la tabla `inferencias`.

---

## 6. Decisiones de diseño y limitaciones

### 6.1 Dockerfile multi-etapa

Se utiliza un Dockerfile multi-etapa para separar las etapas de construcción
y ejecución de la aplicación.

Esta estrategia permite reducir el contenido innecesario de la imagen final,
evitando incluir herramientas y dependencias utilizadas únicamente durante
la construcción.

También facilita obtener una imagen de ejecución más pequeña y con una
superficie de ataque reducida.

### 6.2 Usuario sin privilegios

La aplicación debe ejecutarse con un usuario sin privilegios de administrador
dentro del contenedor.

Esto aplica el principio de mínimo privilegio: si la aplicación fuera
comprometida, el atacante tendría menos permisos dentro del contenedor que si
el proceso se ejecutara como `root`.

### 6.3 Motor ECO

El motor ECO se utiliza como línea base de clasificación porque funciona
mediante reglas y expresiones regulares, sin requerir un modelo de lenguaje
ni realizar inferencia mediante un servicio externo.

Sus principales ventajas son:

* Bajo consumo de recursos.
* Baja latencia.
* Funcionamiento sencillo.
* No requiere descargar un modelo de lenguaje.
* Permite comparar su comportamiento con el motor Ollama.

El modelo lógico utilizado por este motor es `reglas-v1`.

### 6.4 Privilegios mínimos en PostgreSQL

La aplicación utiliza el usuario `app_ia` en lugar del usuario administrador
`postgres`.

Esta decisión reduce el impacto de un posible compromiso de la aplicación,
ya que el usuario de la aplicación solamente necesita los permisos necesarios
para trabajar con la tabla `inferencias`.

Las tareas administrativas de PostgreSQL se realizan utilizando el usuario
administrador.

### 6.5 Limitaciones conocidas

La solución presenta las siguientes limitaciones:

* El motor ECO depende de reglas y expresiones regulares, por lo que puede
  clasificar incorrectamente mensajes que utilicen palabras o expresiones no
  contempladas.
* El motor Ollama depende de que el servicio Ollama esté disponible y del
  modelo configurado.
* La inferencia mediante Ollama puede presentar una latencia mayor que el
  motor ECO.
* La API actualmente no implementa autenticación de usuarios.
* Los endpoints no tienen un sistema de autorización basado en roles.
* PostgreSQL almacena el historial de inferencias, pero la solución no
  implementa por sí misma una política automática de retención de datos.
* El respaldo se realiza mediante comandos manuales y no mediante una tarea
  automática programada.
* La restauración probada utiliza un archivo SQL generado por `pg_dump`.
* La solución está orientada a un entorno controlado y requiere medidas
  adicionales de seguridad y disponibilidad para un entorno de producción.

---

## 7. Mantenimiento

Para realizar tareas de mantenimiento se recomienda:

1. Verificar el estado de los contenedores mediante Docker Compose.
2. Comprobar el endpoint `/health`.
3. Revisar los registros de la aplicación ante errores.
4. Realizar respaldos periódicos de PostgreSQL.
5. Mantener las credenciales fuera del código fuente.
6. Actualizar las dependencias de la aplicación cuando corresponda.
7. Verificar el funcionamiento de los motores ECO y Ollama después de cambios
   importantes.
8. Probar periódicamente la restauración de los respaldos.
