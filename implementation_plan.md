# Sistema Inteligente de Gestión de Turnos Médicos

Este documento presenta la propuesta de arquitectura, esquema de base de datos, estructura de carpetas y plan de implementación, basándose en los requisitos del prompt maestro.

## Análisis de Requisitos y Posibles Problemas de Arquitectura

1.  **Manejo de Zonas Horarias:** 
    *   *Problema:* Almacenar la disponibilidad del médico (`DoctorAvailability`) en hora local (`HH:mm`) puede generar complicaciones si en el futuro se soportan zonas horarias con Horario de Verano (DST). 
    *   *Solución propuesta (Mejora):* Aunque `America/Argentina/Mendoza` no usa DST actualmente, es una buena práctica utilizar la combinación de `date-fns-tz` para resolver el horario exacto al momento de calcular los slots en el servidor. Nos aseguraremos de calcular en tiempo real los slots UTC en base al `dayOfWeek` y la fecha consultada.
2.  **Condiciones de Carrera en Reservas:**
    *   *Problema:* Dos usuarios intentando reservar el mismo slot simultáneamente.
    *   *Solución:* Implementaremos un `Prisma.$transaction` con el nivel de aislamiento adecuado o un bloqueo optimista / chequeo estricto `startTime < existing.endTime AND endTime > existing.startTime` dentro de la misma transacción de creación/actualización.
3.  **Soft Deletes y Unicidad:**
    *   *Problema:* Un usuario se borra lógicamente (`deletedAt != null`) y luego intenta registrarse de nuevo con el mismo email. El constraint de unicidad en Prisma fallará.
    *   *Solución propuesta (Mejora):* Ajustar el modelo de datos. Una forma sencilla en Postgres es un índice único parcial (que en Prisma se puede lograr a nivel de base de datos, o validando en la capa de aplicación). Alternativamente, podemos añadir el timestamp de borrado al email al realizar el soft delete (ej: `email@domain.com_deleted_123456`), o simplemente reactivar la cuenta. Se optará por re-activar la cuenta o aplicar validación a nivel aplicación para no complicar el esquema Prisma por defecto.

## User Review Required

> [!IMPORTANT]
> **Modelo de Usuarios y Roles:** El prompt menciona entidades separadas `User`, `Patient`, `Doctor`. Para la autenticación (Auth.js), es conveniente que `Patient` y `Doctor` estén vinculados a un `User` base mediante relaciones 1 a 1, o usar Single Table Inheritance. He propuesto un modelo donde `User` tiene un rol (`ADMIN`, `DOCTOR`, `PATIENT`) y relaciones opcionales a las tablas específicas `Doctor` y `Patient` para guardar datos adicionales. ¿Estás de acuerdo con este enfoque relacional?

> [!WARNING]
> **Índices Únicos y Soft Delete:** Como mencioné arriba, si usamos Soft Delete (`deletedAt`) en `User`, la restricción `@unique` en `email` causará problemas si el mismo paciente se vuelve a registrar. ¿Deseas que implementemos la reactivación de cuenta en lugar de permitir un nuevo registro con el mismo email, o que apliquemos un sufijo al email al borrar? Para el plan, asumiré que se manejará a nivel de servicio (reactivación o error "Email ya en uso, contacte al admin").

## Open Questions

1.  ¿Deseas que inicialicemos el proyecto con Next.js usando npm, pnpm o yarn? (Usaré `npm` por defecto).
2.  El prompt menciona usar Neon (PostgreSQL). ¿Ya tienes la URL de la base de datos para agregarla al `.env` en tu entorno local, o prefieres que usemos una base de datos local (Docker/PostgreSQL) para el desarrollo antes de pasar a Vercel/Neon?

---

## Arquitectura Inicial

**Frontend:**
*   **Next.js 15 (App Router):** Renderizado híbrido (SSR/CSR). Utilizaremos Server Components predominantemente para mejorar la carga y la seguridad.
*   **Tailwind CSS + shadcn/ui:** Sistema de diseño limpio, componentes accesibles y personalizables.

**Backend:**
*   **Server Actions:** Para mutaciones (crear turno, cancelar turno, actualizar perfil). Permiten validación estricta y ejecución de transacciones Prisma.
*   **Route Handlers:** Para APIs específicas o webhooks si fuesen necesarios, aunque priorizaremos Server Actions.
*   **Autenticación:** Auth.js (NextAuth v5) con JWT. Se utilizará un adaptador personalizado o la validación directa en el callback `authorize` para el login con credenciales.

**Capa de Datos:**
*   **Prisma ORM:** Para acceso seguro y tipado a PostgreSQL.
*   **Reglas de negocio (Servicios):** Capa intermedia en `src/features/` para separar la lógica de base de datos de los Server Actions, facilitando el testing unitario.

**Módulo IA:**
*   **Vercel AI SDK + Groq:** Módulo aislado en `src/lib/ai/` implementando la interfaz `AIProvider`. Zod se usará para forzar respuestas estructuradas (`generateObject`).

---

## Estructura de Carpetas (Propuesta)

```text
src/
  app/
    (auth)/             # Rutas: /login, /register
    dashboard/          # Layout protegido
      admin/
      doctor/
      patient/
    api/                # Route Handlers (ej: Auth.js)
  components/
    ui/                 # Componentes de shadcn/ui
    layout/             # Navbars, Sidebars, etc.
    shared/             # Componentes comunes (ej: DataTables)
  features/             # Lógica de negocio por dominio
    appointments/
    users/
    doctors/
    patients/
  actions/              # Next.js Server Actions
  hooks/                # Custom React hooks
  schemas/              # Zod schemas (compartidos cliente/servidor)
  types/                # TypeScript types/interfaces globales
  lib/
    ai/                 # Capa de abstracción de IA (AIProvider)
    auth/               # Configuración de Auth.js
    db/                 # Instancia de Prisma Client
    utils/              # Funciones helper (ej: formateo de fechas)
tests/
  unit/                 # Vitest specs
prisma/
  schema.prisma
  seed.ts
```

---

## Esquema de Base de Datos (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  DOCTOR
  PATIENT
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum NotificationType {
  REMINDER
  CANCELLATION
  RESCHEDULE
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(PATIENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  patient       Patient?
  doctor        Doctor?
  aiInteractions AIInteraction[]
}

model Patient {
  id            String    @id @default(cuid())
  userId        String    @unique
  firstName     String
  lastName      String
  phone         String?
  birthDate     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  user          User      @relation(fields: [userId], references: [id])
  appointments  Appointment[]
  notifications Notification[]
}

model Doctor {
  id                         String    @id @default(cuid())
  userId                     String    @unique
  firstName                  String
  lastName                   String
  specialty                  String
  appointmentDurationMinutes Int       @default(30)
  createdAt                  DateTime  @default(now())
  updatedAt                  DateTime  @updatedAt
  deletedAt                  DateTime?

  user                       User      @relation(fields: [userId], references: [id])
  availabilities             DoctorAvailability[]
  appointments               Appointment[]
}

model DoctorAvailability {
  id        String   @id @default(cuid())
  doctorId  String
  dayOfWeek Int      // 0 = Domingo ... 6 = Sábado
  startTime String   // Formato "HH:mm" (Local)
  endTime   String   // Formato "HH:mm" (Local)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  doctor    Doctor   @relation(fields: [doctorId], references: [id])

  @@index([doctorId, dayOfWeek])
}

model Appointment {
  id          String            @id @default(cuid())
  patientId   String
  doctorId    String
  startTime   DateTime          // UTC Timestamp
  endTime     DateTime          // UTC Timestamp
  status      AppointmentStatus @default(PENDING)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  deletedAt   DateTime?

  patient     Patient           @relation(fields: [patientId], references: [id])
  doctor      Doctor            @relation(fields: [doctorId], references: [id])
  medicalNote MedicalNote?

  @@index([doctorId, startTime, endTime])
  @@index([patientId])
}

model MedicalNote {
  id            String      @id @default(cuid())
  appointmentId String      @unique
  content       String      // Texto libre de observación
  aiSummary     String?
  aiFindings    String?     // JSON o texto estructurado
  aiUrgency     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  appointment   Appointment @relation(fields: [appointmentId], references: [id])
}

model AIInteraction {
  id           String   @id @default(cuid())
  userId       String
  feature      String   // ej: 'medical_summary', 'schedule_suggestion'
  provider     String   // ej: 'groq/llama-3.3-70b-versatile'
  inputSummary String
  outputJson   String
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])
}

model Notification {
  id        String           @id @default(cuid())
  patientId String
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  patient   Patient          @relation(fields: [patientId], references: [id])
}
```

---

## Plan de Implementación por Etapas

1.  **Configuración inicial:** Inicialización de Next.js, Tailwind, shadcn/ui. Configuración de ESLint, Prettier y TypeScript strict.
2.  **Prisma Schema & Base de datos:** Instalación de Prisma, definición del esquema `schema.prisma`, creación de migraciones.
3.  **Seed de Datos:** Creación de `prisma/seed.ts` con usuarios (Admin, Médicos, Pacientes), disponibilidades y turnos de ejemplo.
4.  **Autenticación y Autorización:** Configuración de NextAuth v5 (Auth.js) con estrategia JWT y `bcryptjs`. Implementación del middleware de roles y rutas `/login`, `/register`.
5.  **CRUD Médicos & Pacientes (Admin):** Desarrollo de vistas administrativas para gestionar el personal y los pacientes (Server Actions, tablas shadcn).
6.  **Lógica de Turnos (Core):** Implementación de la creación, cancelación y reprogramación de turnos. Incluye validaciones complejas (solapamientos, zona horaria con `date-fns-tz`, restricciones de 2 horas) a través de servicios mockeables y transacciones atómicas.
7.  **CRUD Turnos & Vistas por Rol:** Vistas de agenda para médicos, historial para pacientes, y gestión global para administradores.
8.  **Dashboard:** Implementación de gráficos con Recharts para Admin, vistas resumen para Médico y Paciente.
9.  **Módulo IA:** Integración de Vercel AI SDK con Groq. Implementación de `AIProvider`. Funcionalidades de resumen de notas, sugerencia de horarios, mensajes a pacientes (Notificaciones) y recomendaciones administrativas.
10. **Tests (Vitest):** Redacción de tests unitarios para autenticación, esquemas Zod, y reglas de negocio de turnos mockeando Prisma y AI.
11. **CI/CD & Documentación:** Configuración de GitHub Actions, redacción final del `README.md` y `TECHNICAL_REPORT.md`.

---

## Verification Plan

### Automated Tests
- Ejecutar `npm run test` usando Vitest para validar las reglas de solapamiento de turnos.
- Ejecutar validación estricta de tipos `npm run typecheck`.
- Linting con `npm run lint`.

### Manual Verification
- Levantar servidor local y probar registro de paciente, login como admin, login como doctor.
- Intentar reservar dos turnos en el mismo horario para verificar el rechazo de la transacción.
- Verificar la correcta renderización de la interfaz (Dashboards, Dark/Light mode de shadcn/ui).
- Probar llamadas al módulo IA interactuando con la interfaz de notas médicas.
