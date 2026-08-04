
#!/bin/bash
# diagnostico.sh - Reporte del estado del entorno
echo "=== SISTEMA ==="; uname -a
echo "=== MEMORIA ==="; free -h
echo "=== DISCO ==="; df -h /
echo "=== VERSIONES ==="
git --version || echo "git NO instalado"
python3 --version || echo "python3 NO instalado"
docker --version || echo "docker NO instalado"
docker compose version || echo "compose NO instalado"
ollama --version || echo "ollama NO instalado"
echo "=== SERVICIOS ==="
systemctl is-active docker || echo "docker inactivo"
echo "=== CONTENEDORES ==="; docker ps -a 2>/dev/null || true
echo "=== MODELOS ==="; ollama list 2>/dev/null || true
chmod +x setup.sh diagnostico.sh

git add setup.sh diagnostico.sh
git commit -m "feat(infra): scripts de aprovisionamiento y diagnostico"
git push origin main
