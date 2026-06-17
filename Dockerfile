# Etapa de construcción
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Construir la aplicación para producción
RUN npm run build

# Etapa de producción
FROM nginx:alpine
# Copiar los assets construidos al directorio de nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copiar configuración personalizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
