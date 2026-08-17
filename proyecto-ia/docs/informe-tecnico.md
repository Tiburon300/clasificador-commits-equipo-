# Informe técnico — Caracterización del modelo local

| Dato | Cómo obtenerlo | Valor |
|---|---|---|
| Perfil de hardware | Sección 2 de la guía | Perfil A |
| RAM total del equipo | `free -h` | 16 GB |
| Modelo y etiqueta | `ollama list` | qwen2.5-coder:1.5b |
| Tamaño en disco | `ollama list` | 986 MB |
| Latencia de 5 ejecuciones (ms) | `time curl ...` cinco veces | 1(1943ms) 2(303ms) 3(335ms) 4(259ms) 5(247ms) |
| Latencia promedio | Promedio de las cinco | Latencia promedio 617,4ms |
| RAM usada durante la inferencia | `free -h` mientras responde | 6,7 GiB |
| Calidad percibida (1 a 5) | Su criterio, con una frase que lo justifique | 4 — El modelo responde de forma rápida y coherente a preguntas sencillas, especialmente relacionadas con programación, aunque puede presentar respuestas menos detalladas en algunas consultas |

## Pruebas de aceptación

[tabla de P-01 a P-09]

| ID | Prueba | Resultado esperado | Obtenido | Estado |
|---|---|---|---|---|
| P-01 | Verificar estado de la API y base de datos mediante `GET /health` | Código 200 y estado de API y BD en `ok` | `{"estado":"ok","base_datos":"ok"}` | PASA |
| P-02 | Clasificar una entrada usando el motor Ollama | Código 200 y clasificación correcta | Motor `ollama`, modelo `qwen2.5-coder:1.5b`, tipo `feat` | PASA |
| P-03 | Enviar un motor inexistente | La API debe rechazar la solicitud con código 400 | Código 400 al enviar `motor: "inventado"` | PASA |
| P-04 | Intentar eliminar la tabla `inferencias` con el usuario `app_ia` | El usuario de aplicación no debe poder eliminar tablas | `ERROR: must be owner of table inferencias` | PASA |
| P-05 | Verificar conectividad entre la API y PostgreSQL | La API debe poder resolver y comunicarse con el servicio `db` | `172.18.0.2 db` | PASA |
| P-06 | Reiniciar PostgreSQL y verificar recuperación de la API | La API debe recuperar la conexión con la base de datos | Después de reiniciar `db-ia`, `/health` respondió `{"estado":"ok","base_datos":"ok"}` | PASA |
| P-07 | Verificar persistencia de datos después de reiniciar los contenedores | Los registros deben conservarse | Después de `docker compose down` y `up -d`, `/inferencias?limite=5` devolvió los registros existentes, incluyendo los IDs 651–655 | PASA |
| P-08 | Realizar prueba de carga sobre la API | p95 < 800 ms y tasa de errores < 5 % | p95 = **39.92 ms**, errores = **0.00 %**, 1288 checks y 100 % exitosos | PASA |
| P-09 | Caracterizar la latencia del modelo Ollama | Obtener promedio, mediana y p95 de 10 ejecuciones | Promedio = **707 ms**, mediana = **706 ms**, p95 = **817 ms** | PASA |

### Análisis de resultados

[análisis de las pruebas]

Se realizaron nueve pruebas de aceptación. Las pruebas P-01 a P-08
cumplieron los criterios establecidos.

La caracterización del modelo Ollama (P-09) obtuvo un promedio de
707 ms, una mediana de 706 ms y un p95 de 817 ms. El valor p95 supera
ligeramente el objetivo de 800 ms establecido para el servicio, por lo
que este resultado se registra como una medición de rendimiento y no
como un fallo funcional del sistema.

En general, la API, la base de datos, la persistencia, la seguridad de
los privilegios y la prueba de carga funcionan correctamente.
