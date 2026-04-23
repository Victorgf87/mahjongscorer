#!/bin/bash

# Configuración
SECRETS_FILE="credentials.enc"
MASTER_KEY_FILE="master.key"
TEMP_FILE="secrets.json"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

get_master_key() {
    if [ -f "$MASTER_KEY_FILE" ]; then
        cat "$MASTER_KEY_FILE"
    elif [ ! -z "$MAHJONG_PWA_MASTER_KEY" ]; then
        echo "$MAHJONG_PWA_MASTER_KEY"
    else
        echo -e "${RED}Error: No se encuentra master.key ni la variable MAHJONG_PWA_MASTER_KEY${NC}" >&2
        exit 1
    fi
}

case "$1" in
    init)
        if [ -f "$MASTER_KEY_FILE" ]; then
            echo -e "${RED}Ya existe una Master Key.${NC}"
            exit 1
        fi
        openssl rand -base64 32 > "$MASTER_KEY_FILE"
        echo -e "{" > "$TEMP_FILE"
        echo -e "  \"GEMINI_KEY\": \"\",\n  \"GRAFANA_URL\": \"\",\n  \"GRAFANA_USER\": \"\",\n  \"GRAFANA_TOKEN\": \"\"" >> "$TEMP_FILE"
        echo -e "}" >> "$TEMP_FILE"
        echo -e "${GREEN}Iniciado. Edita secrets.json y luego ejecuta: ./secrets.sh encrypt${NC}"
        ;;

    encrypt)
        KEY=$(get_master_key)
        if [ ! -f "$TEMP_FILE" ]; then
            echo -e "${RED}Error: No se encuentra $TEMP_FILE${NC}"
            exit 1
        fi
        openssl enc -aes-256-cbc -salt -pbkdf2 -in "$TEMP_FILE" -out "$SECRETS_FILE" -k "$KEY"
        echo -e "${GREEN}Secretos cifrados en $SECRETS_FILE${NC}"
        ;;

    edit)
        KEY=$(get_master_key)
        if [ ! -f "$SECRETS_FILE" ]; then
            echo -e "${RED}No hay archivo cifrado. Usa init primero.${NC}"
            exit 1
        fi
        # Descifrar a archivo temporal
        openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$SECRETS_FILE" -out "$TEMP_FILE" -k "$KEY"
        
        # Abrir editor
        ${EDITOR:-vi} "$TEMP_FILE"
        
        # Volver a cifrar
        openssl enc -aes-256-cbc -salt -pbkdf2 -in "$TEMP_FILE" -out "$SECRETS_FILE" -k "$KEY"
        
        # Borrar temporal
        rm "$TEMP_FILE"
        echo -e "${GREEN}Secretos actualizados y cifrados.${NC}"
        ;;

    apply)
        KEY=$(get_master_key)
        PROJECT_NAME=$(grep "name =" wrangler.toml | cut -d'"' -f2 || echo "mahjong-scorer-pwa")
        echo -e "${BLUE}Subiendo secretos a Cloudflare Pages ($PROJECT_NAME)...${NC}"
        JSON=$(openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$SECRETS_FILE" -k "$KEY")
        
        if command -v jq >/dev/null 2>&1; then
            echo "$JSON" | jq -r 'to_entries | .[] | "\(.key) \(.value)"' | while read -r key value; do
                echo -n "$value" | npx wrangler pages secret put "$key" --project-name "$PROJECT_NAME"
                echo -e "✅ $key configurada."
            done
        else
            echo -e "${RED}Error: Se requiere 'jq' para parsear los secretos.${NC}"
            exit 1
        fi
        ;;

    *)
        echo "Uso: ./secrets.sh {init|edit|encrypt|apply}"
        exit 1
        ;;
esac
