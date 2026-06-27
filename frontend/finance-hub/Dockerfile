# Estágio 1: Instalar dependências e fazer o build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia os arquivos de configuração de dependências do subdiretório
COPY frontend/finance-hub/package.json frontend/finance-hub/package-lock.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do projeto do subdiretório
COPY frontend/finance-hub/ .

# Roda o comando de build (vai gerar a pasta /dist)frontend/finance-hub/Dockerfile
RUN npm run build

# Estágio 2: Configurar o servidor Nginx para rodar a aplicação
FROM nginx:alpine

# Copia os arquivos gerados no Estágio 1 para a pasta pública do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão web)
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]