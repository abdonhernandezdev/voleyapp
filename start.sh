#!/bin/bash
# VoleyApp - Script de arranque rápido

echo "🏐 Iniciando VoleyApp..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker no está instalado. Instálalo desde https://docker.com"
  exit 1
fi

# Check docker compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  echo "❌ Docker Compose no está disponible."
  exit 1
fi

echo "✅ Docker detectado"
echo "🔧 Construyendo y arrancando servicios..."
echo ""

docker-compose up -d --build

echo ""
echo "⏳ Esperando que los servicios arranquen (30s)..."
sleep 30

echo ""
echo "✅ VoleyApp lista!"
echo ""
echo "  🌐 Frontend  →  http://localhost:4200"
echo "  🔌 API       →  http://localhost:3000/api"
echo ""
echo "Para parar: docker-compose down"
