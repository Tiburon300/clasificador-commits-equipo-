## Sección de Pruebas

| ID | Tipo | Qué se verifica | Resultado esperado | Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P-01** | Funcional | `GET /health` responde | Código 200 y estado ok | HTTP/1.1 200 OK {"estado":"ok","base_datos":"ok"} | Exitoso |
| **P-02** | Funcional | `POST /clasificar` con motor eco | Código 200 y tipo correcto | HTTP 200 {"motor":"eco","modelo":"reglas-v1","entrada":"corrige el error de conexion","tipo":"fix","latencia_ms":0} | Exitoso |
| **P-03** | Funcional | Motor inválido | Código 400 | HTTP 400 Bad Request | Exitoso |
| **P-04** | Acceso | Rol `app_ia` intenta `DROP TABLE` | Error de permisos | `ERROR: permission denied for table inferencias` | Exitoso |
| **P-05** | Conectividad | La API resuelve el host `db` | Devuelve una IP interna | Resuelve IP en red Docker (`172.18.0.2`) | Exitoso |
| **P-06** | Disponibilidad | Reinicio del contenedor de BD | La API se recupera sola | Tras 15s `/health` vuelve a responder HTTP 200 | Exitoso |
| **P-07** | Persistencia | `down` y `up` conservan los datos | Los registros siguen existiendo | Registros previos retornados en `/inferencias` | Exitoso |
| **P-08** | Carga | 10 usuarios sobre el motor eco | p95 < 800 ms y errores < 5% | p95 = 17.64 ms, 0% errores (654 peticiones) | Exitoso |
| **P-09** | Caracterización | 10 inferencias con modelo | Promedio, mediana y p95 | Promedio: 1219 ms, Mediana: 837 ms, p95: 852 ms | Exitoso |

### Análisis del cuello de botella
Al comparar las pruebas **P-08** (Motor `eco`) y **P-09** (Motor `ollama`), se observa una diferencia de latencia significativa: el motor `eco` responde en un p95 de **17.64 ms**, mientras que el motor `ollama` alcanza un p95 de **852 ms** (con un *cold start* inicial de **4726 ms**).

El cuello de botella **no se encuentra en la API de FastAPI ni en la base de datos PostgreSQL**, ya que ambas manejan tiempos de respuesta en el orden de los milisegundos bajo carga simultánea. El tiempo se pierde en el proceso de **inferencia del modelo de lenguaje (LLM)** en Ollama, debido al costo computacional que requiere la evaluación secuencial de tokens por la CPU/GPU al procesar lenguaje natural.

### Propuestas de mejora
1. **Sistema de Caché para Mensajes Repetidos:** Implementar un almacenamiento en caché (como Redis) para guardar clasificaciones previas de commits recurrentes, respondiendo instantáneamente sin invocar la inferencia del modelo.
2. **Filtrado previo con Motor Eco:** Utilizar el motor `eco` como una primera capa de clasificación ultrarrápida mediante patrones predefinidos, reservando el motor `ollama` exclusivamente para casos ambiguos o complejos.
