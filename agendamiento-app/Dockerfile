# ----------------------------
# STEP 1: Build Stage
# ----------------------------
FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Receive arguments from docker-compose
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_KEY_TENANTS

# Set environment variables for the build process (Vite requires this)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_KEY_TENANTS=$VITE_KEY_TENANTS

# This command will now see the env vars and bake them into the JS bundle
RUN npm run build

# ----------------------------
# STEP 2: Production Stage (Nginx)
# ----------------------------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]