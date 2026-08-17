import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 5 },   // Ramp-up: Subir a 5 usuarios concurrentes en 30s
    { duration: "1m", target: 10 },   // Sustained: Mantener 10 usuarios concurrentes durante 1 min
    { duration: "30s", target: 0 },   // Ramp-down: Bajar a 0 usuarios en 30s
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"], // El 95% de las peticiones debe responder en menos de 800ms
    http_req_failed: ["rate<0.05"],   // La tasa de error debe ser menor al 5%
  },
};

const MENSAJES = [
  "agrega el endpoint de historial",
  "corrige el error de conexion",
  "actualiza el manual de instalacion",
  "agrega pruebas del clasificador",
];

export default function () {
  const texto = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];
  const carga = JSON.stringify({ texto: texto, motor: "eco" });
  const cab = { headers: { "Content-Type": "application/json" } };
  
  const r = http.post("http://localhost:8000/clasificar", carga, cab);
  
  check(r, {
    "codigo 200": (res) => res.status === 200,
    "devuelve tipo": (res) => res.json("tipo") !== undefined,
  });
  
  sleep(1);
}
