#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="mahjong-scorer-pwa"

echo -e "${BLUE}🚀 Desplegando en RAMA DE PRODUCCIÓN REAL...${NC}"

# FORZAMOS LA RAMA 'production' QUE ES LA QUE MANDA EN EL DOMINIO RAÍZ
npx wrangler pages deploy public --project-name "$PROJECT_NAME" --branch production

# 2. Aplicar secretos
if [ -f "credentials.enc" ]; then
    echo -e "${BLUE}🔑 Aplicando secretos cifrados...${NC}"
    ./secrets.sh apply
else
    echo -e "${RED}⚠️ No se encontró credentials.enc.${NC}"
fi

echo -e "${GREEN}✅ ¡SISTEMA ACTUALIZADO EN mahjong-scorer-pwa.pages.dev!${NC}"
