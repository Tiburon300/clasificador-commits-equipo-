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
