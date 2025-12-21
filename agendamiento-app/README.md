# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# 📅 Sistema de Agendamiento SaaS (Frontend)

Este repositorio contiene el cliente web (Frontend) para la plataforma SaaS de agendamiento multi-tenant. Está construido con tecnologías modernas para garantizar rendimiento, escalabilidad y una experiencia de usuario fluida.

## 🚀 Tecnologías Principales

El proyecto utiliza un stack robusto basado en el ecosistema de React:

* **Core:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Build tool ultrarrápido).
* **Lenguaje:** JavaScript (ESModules).
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS).
* **Base de Datos & Auth:** [Supabase](https://supabase.com/) (Backend-as-a-Service).
* **Calendario:** `react-big-calendar` (Gestión visual de citas y turnos).
* **Enrutamiento:** `react-router-dom` v7.
* **Internacionalización (i18n):** `i18next` (Soporte Español/Inglés).
* **Iconos:** `lucide-react`.
* **Notificaciones:** `react-hot-toast`.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu entorno local:

* **Node.js:** v18 o superior (Recomendado v20 LTS).
* **npm:** v9 o superior.
* **Docker & Docker Compose:** (Opcional, para despliegue contenerizado).

## ⚙️ Configuración del Entorno

El proyecto requiere variables de entorno para conectarse a Supabase.

1. Crea un archivo `.env` en la raíz del proyecto (o usa el `.env` en la raíz del monorepo si usas Docker).
2. Agrega las siguientes claves:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

Create a docker-compose.yml off the root folder like this 

version: '3.8'

services:
  frontend:
    container_name: mi-saas-frontend
    build:
      context: ./agendamiento-app  # Nombre de tu carpeta del proyecto
      dockerfile: Dockerfile
      # --- AQUÍ PASAMOS LAS VARIABLES AL BUILD ---
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
    ports:
      - "80:80"
    restart: always