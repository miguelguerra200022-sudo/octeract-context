# TESSERACT-CONTEXT: Dockerfile Multi-Arquitectura (AMD64 & ARM64)
FROM node:22-alpine

LABEL org.opencontainers.image.title="Tesseract-Context"
LABEL org.opencontainers.image.description="Fractal 4D Hypercube Context Engine and MCP Server"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json tsconfig.json .npmrc ./

# Copiar código fuente
COPY src/ ./src/
COPY bin/ ./bin/

RUN chmod +x ./bin/tesseract-context.js

# Directorio de trabajo del proyecto a indexar
WORKDIR /workspace

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV TESSERACT_WORKSPACE=/workspace

# Comando por defecto: inicia el servidor MCP sobre stdio
ENTRYPOINT ["node", "--experimental-strip-types", "/app/src/index.ts"]
CMD ["mcp", "/workspace"]
