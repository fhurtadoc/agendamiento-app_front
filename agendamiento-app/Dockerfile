# ----------------------------
# ETAPA 1: Construcción (Build)
# ----------------------------
FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# --- CORRECCIÓN AQUÍ ---
# Definimos que aceptaremos estos argumentos desde el exterior (Docker Compose)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Establecemos las variables de entorno para que Vite las lea al compilar
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# -----------------------

RUN npm run build

# ----------------------------
# ETAPA 2: Servidor Producción (Nginx)
# ----------------------------
FROM nginx:alpine

# Asumiendo que nginx.conf está en la misma carpeta que este Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]