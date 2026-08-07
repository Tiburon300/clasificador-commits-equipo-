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
│   reglas-v1      │    │ qwen2.5-coder:1.5b  │
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
