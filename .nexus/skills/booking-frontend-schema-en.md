booking-frontend-schema-en

Use this skill when the user asks for help generating frontend code, UI components, or booking flows for the Supabase massage appointment system. It provides the database schema (tenants, branches, profiles) to ensure frontend alignment.
Instructions
Booking System Context (Backend)
Overview

This skill contains the architectural knowledge of the Supabase database for a multi-tenant massage booking system. Use this structure whenever you need to generate frontend code (React, Vue, etc.), hooks, or UI flows, ensuring that the queries and interfaces perfectly align with the database.
Database Structure

    tenants: Represents the main brand or company. Everything falls under a tenant_id.
    branches: Physical branch locations. Directly related to a tenant_id.
    profiles: System users.
        Clients: Have a tenant_id. They belong to the global brand, not a specific branch.
        Employees (Masseuses): Have a tenant_id and also a branch_id (optional/associated) to indicate which physical branch they work at.
    services: Catalog of massage services (duration, price) linked to the tenant_id.
    appointments: Medical/massage appointments. Centrally relate: tenant_id, branch_id, client_id, employee_id, and service_id.

Rules for Frontend Flow

When generating the booking process for the user in the frontend, implement this strict order of steps:

    Initial Context: The frontend must know/fetch the current tenant_id.
    Step 1 - Branch Selection: Query the branches table filtering by tenant_id. The user must choose which location they want their massage at before anything else.
    Step 2 - Employee Selection: Once the branch is selected, query the profiles table filtering by role = 'employee' and the branch_id selected in Step 1. Show only the masseuses available at that location.
    Step 3 - Service and Time Selection: The user chooses the type of massage (services) and the date/time.
    Step 4 - Confirmation and Insertion: When saving the appointment in Supabase (appointments), the frontend must send the complete data payload, including tenant_id, branch_id, client_id (the current user), employee_id, service_id, and the dates.

Additional Considerations

    Avoid assuming clients are tied to a single branch. Their profiles do not use branch_id.
    If the user asks for a scheduling UI component, always include the branch selector in the initial design.