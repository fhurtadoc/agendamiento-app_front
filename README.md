# 📅 Multi-Tenant Scheduling SaaS

This repository contains the source code for a complete SaaS scheduling platform. The system allows multiple organizations (`tenants`) to manage their own calendars, staff, and services in a secure, isolated environment.

The project is divided into two main layers:
1.  **Backend:** PostgreSQL managed by Supabase (Auth, Database, Realtime, Edge Functions).
2.  **Frontend:** SPA built with React 19 and Vite.

---

## 🚀 Tech Stack

### Frontend (Web Client)
The client is built with modern technologies to ensure performance and scalability:

* **Core:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Ultra-fast build tool).
* **Language:** JavaScript (ESModules).
* **Styles:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS).
* **Database & Auth:** [Supabase JS Client](https://supabase.com/).
* **Calendar:** `react-big-calendar` (Visual management of appointments and shifts).
* **Routing:** `react-router-dom` v7.
* **Internationalization (i18n):** `i18next` (Spanish/English support).
* **Icons:** `lucide-react`.
* **Notifications:** `react-hot-toast`.

### Backend (Database & Logic)
All business logic resides within the database to ensure data integrity and speed:

* **Engine:** PostgreSQL (via Supabase).
* **Security:** Strict RLS (Row Level Security) for Multi-Tenant isolation.
* **Automation:** PostgreSQL Triggers for automatic appointment assignment and user management.
* **Functions:** RPCs (Remote Procedure Calls) for complex availability calculations.

---

## 📋 Prerequisites

Ensure you have the following installed in your local environment:

* **Node.js:** v18 or higher (v20 LTS Recommended).
* **npm:** v9 or higher.
* **Docker & Docker Compose:** (Optional, for containerized deployment).
* **Supabase Account:** For the backend.

---

## ⚙️ Environment Configuration

The project requires environment variables to connect to Supabase.

1.  Create a `.env` file in the project root.
2.  Add the following keys:

```env
# Supabase Connection
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional Configuration
VITE_KEY_TENANTS=optional_master_key

```

---

## 🛠️ Installation & Development (Local)

Follow these steps to run the project without Docker:

1. **Install dependencies:**
```bash
cd agendamiento-app
npm install

```


2. **Run development server:**
```bash
npm run dev

```


3. **Build for production:**
```bash
npm run build

```



### React + Vite (Template Notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh.
* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh.

**React Compiler:** The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

**ESLint:** If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

---

## 🐳 Docker Deployment

To deploy the application using containers, use the `docker-compose.yml` file provided in the root directory.

**Note:** It is crucial to pass environment variables as `ARGS` during the build process so Vite can inject them into the static code.

```yaml
version: '3.8'

services:
  frontend:
    container_name: my-saas-frontend
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

To start the container:

```bash
docker-compose up --build -d

```

---

## 🗄️ Database Structure (Backend Setup)

For the frontend to function correctly, you must execute the SQL scripts in your Supabase dashboard in the following order:

### 1. Initial Setup

* Enable `uuid-ossp` extension.
* Create `app_role` ENUM type ('admin', 'employee', 'client').

### 2. Core Tables

* **`public.tenants`**: Stores company configuration (opening hours, timezone, slug).
* **`public.profiles`**: Extension of `auth.users`. Links users to a specific Tenant.
* **`public.services`**: Service catalog with prices and duration.
* **`public.appointments`**: Central transactional table with strict status validation.
* **`public.employee_time_off`**: Management of vacations and breaks.

### 3. Security (RLS Policies)

The system implements strict **Row Level Security**.

* A helper function `get_my_claim()` is used to prevent recursion.
* Data is isolated by `tenant_id`. A user from "Company A" will never see data from "Company B".

### 4. Critical Functions (RPCs and Triggers)

* **`handle_new_user` (Trigger):** Automatically creates the profile and assigns the tenant upon registration. Auto-confirms employee emails.
* **`auto_assign_employee` (Trigger):** If no stylist is selected, it randomly assigns an available one (Load Balancer logic).
* **`get_available_slots` (RPC):** Function callable from the frontend. Accepts date and tenant ID, returning free slots by calculating opening hours and existing appointments.

---

## 📄 License

This project is proprietary and intended for commercial use under the SaaS model.

```

```