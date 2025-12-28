# 📅 Sistema de Agendamiento Multi-Tenant (SaaS)

Este repositorio contiene el código fuente de una plataforma SaaS de agendamiento completa. El sistema permite a múltiples organizaciones (`tenants`) gestionar sus propios calendarios, empleados y servicios de forma aislada y segura.

El proyecto está dividido en dos capas principales:
1.  **Backend:** PostgreSQL gestionado por Supabase (Auth, Database, Realtime, Edge Functions).
2.  **Frontend:** SPA construida con React 19 y Vite.

---

## 🚀 Stack Tecnológico

### Frontend (Cliente Web)
El cliente está construido con tecnologías modernas para garantizar rendimiento y escalabilidad:

* **Core:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Build tool ultrarrápido).
* **Lenguaje:** JavaScript (ESModules).
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS).
* **Base de Datos & Auth:** [Supabase JS Client](https://supabase.com/).
* **Calendario:** `react-big-calendar` (Gestión visual de citas y turnos).
* **Enrutamiento:** `react-router-dom` v7.
* **Internacionalización (i18n):** `i18next` (Soporte Español/Inglés).
* **Iconos:** `lucide-react`.
* **Notificaciones:** `react-hot-toast`.

### Backend (Base de Datos & Lógica)
Toda la lógica de negocio reside en la base de datos para asegurar integridad y velocidad:

* **Motor:** PostgreSQL (vía Supabase).
* **Seguridad:** RLS (Row Level Security) estricto para aislamiento Multi-Tenant.
* **Automatización:** Triggers de PostgreSQL para asignación de citas y gestión de usuarios.
* **Funciones:** RPCs (Remote Procedure Calls) para cálculos complejos de disponibilidad.

---

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu entorno local:

* **Node.js:** v18 o superior (Recomendado v20 LTS).
* **npm:** v9 o superior.
* **Docker & Docker Compose:** (Opcional, para despliegue contenerizado).
* **Cuenta de Supabase:** Para el backend.

---

## ⚙️ Configuración del Entorno

El proyecto requiere variables de entorno para conectarse a Supabase.

1.  Crea un archivo `.env` en la raíz del proyecto.
2.  Agrega las siguientes claves:

```env
# Conexión a Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

# Configuración opcional
VITE_KEY_TENANTS=clave_maestra_opcional

```

---

## 🛠️ Instalación y Desarrollo (Local)

Sigue estos pasos para correr el proyecto sin Docker:

1. **Instalar dependencias:**
```bash
cd agendamiento-app
npm install

```


2. **Correr servidor de desarrollo:**
```bash
npm run dev

```


3. **Build para producción:**
```bash
npm run build

```



### React + Vite (Notas del Template)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh.
* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh.

**React Compiler:** The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

**ESLint:** If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

---

## 🐳 Despliegue con Docker

Para desplegar la aplicación utilizando contenedores, utiliza el archivo `docker-compose.yml` proporcionado en la raíz.

**Nota:** Es crucial pasar las variables de entorno como `ARGS` durante el build para que Vite pueda inyectarlas en el código estático.

```yaml
version: '3.8'

services:
  frontend:
    container_name: mi-saas-frontend
    build:
      context: ./agendamiento-app
      dockerfile: Dockerfile
      # FIX: Pass variables from local .env to Dockerfile ARGs during build
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
        - VITE_KEY_TENANTS=${VITE_KEY_TENANTS} 
    ports:
      - "80:80"
    restart: always

```

Para iniciar el contenedor:

```bash
docker-compose up --build -d

```

---

## 🗄️ Estructura de Base de Datos (Backend Setup)

Para que el frontend funcione, debes ejecutar los scripts SQL en tu panel de Supabase en el siguiente orden:

### 1. Configuración Inicial

* Habilitar extensión `uuid-ossp`.
* Crear tipo ENUM `app_role` ('admin', 'employee', 'client').

### 2. Tablas Principales

* **`public.tenants`**: Almacena configuración de la empresa (horarios, timezone, slug).
* **`public.profiles`**: Extensión de `auth.users`. Vincula usuarios a un Tenant.
* **`public.services`**: Catálogo de servicios con precios y duración.
* **`public.appointments`**: Tabla central de citas con validación de estados.
* **`public.employee_time_off`**: Gestión de vacaciones y descansos.

### 3. Seguridad (RLS Policies)

El sistema implementa **Row Level Security** estricto.

* Se utiliza una función helper `get_my_claim()` para evitar recursión.
* Los datos están aislados por `tenant_id`. Un usuario de la "Empresa A" jamás verá datos de la "Empresa B".

### 4. Funciones Críticas (RPCs y Triggers)

* **`handle_new_user` (Trigger):** Crea automáticamente el perfil y asigna el tenant al registrarse. Confirma emails de empleados automáticamente.
* **`auto_assign_employee` (Trigger):** Si no se selecciona un estilista, asigna uno disponible al azar (Load Balancer).
* **`get_available_slots` (RPC):** Función invocable desde el frontend. Recibe fecha y tenant, y devuelve los huecos libres calculando horarios de apertura y citas existentes.

---

## 📄 Licencia

Este proyecto es propiedad privada y está destinado para uso comercial bajo el modelo SaaS.

```

```