# Sistema Inteligente de Gestión de Turnos Médicos

## Objetivo

Construir una aplicación web full-stack lista para producción que permita administrar médicos, pacientes y turnos médicos.

El proyecto será utilizado como Trabajo Práctico Integrador universitario, por lo que debe priorizar:

* Código limpio y mantenible.
* Arquitectura clara y documentada.
* Buen uso de IA.
* Despliegue simple y reproducible.
* Documentación completa.
* Uso de servicios gratuitos.

### Entregables finales

* Repositorio público en GitHub.
* Aplicación desplegada en Vercel.
* README.md
* .env.example.
* Migraciones Prisma.
* Script de seed.
* Tests automatizados.

---

# Instrucciones Iniciales

Antes de escribir código:

1. Analizar todos los requisitos.
2. Detectar posibles problemas de arquitectura.
3. Proponer mejoras razonables sin aumentar significativamente la complejidad del proyecto.
4. Generar la arquitectura inicial.
5. Generar la estructura de carpetas.
6. Generar el esquema de base de datos.
7. Generar un plan de implementación por etapas.

**No comenzar generando cientos de archivos directamente.**

Primero presentar:

* Arquitectura.
* Estructura del proyecto.
* Prisma Schema.
* Plan de implementación.

Esperar confirmación antes de continuar con la generación masiva de código.

---

# Stack Tecnológico Obligatorio

## Frontend

* Next.js 15 (App Router)
* React 18 o 19 (la versión compatible que determine Next.js 15 sin generar conflictos de peer dependencies)
* TypeScript (strict)
* TailwindCSS
* shadcn/ui

## Backend

* Next.js Route Handlers
* Server Actions

## Base de Datos

* SQLite
* PostgreSQL (Neon) (Segunda etapa despliege, aún no nos enfoquemos en ello pero tengamoslo en cuenta)
## ORM

* Prisma

## Autenticación

* Auth.js (NextAuth v5)
* JWT Session Strategy
* bcryptjs para hash de contraseñas
* No implementar recuperación/reseteo de contraseña por email; está fuera del alcance de este proyecto.

## Validación

* Zod

## Manejo de fechas

* date-fns
* date-fns-tz

Zona horaria por defecto:

America/Argentina/Mendoza

Reglas de manejo de fechas:

* Los `Appointment.startTime` y `Appointment.endTime` deben almacenarse en UTC y convertirse al mostrarse en la interfaz.
* `DoctorAvailability` representa horarios **recurrentes semanales** y debe almacenarse como `dayOfWeek` (0-6) + hora local (`startTime`/`endTime` en formato `HH:mm`, en la zona horaria por defecto), **no** como timestamps UTC fijos. La conversión a UTC se hace en el momento de calcular los slots disponibles para una fecha concreta.

## Testing

* Vitest
* React Testing Library

## Deploy

* Vercel

## CI/CD

* GitHub Actions

## IA

* Vercel AI SDK
* Groq como proveedor principal
* Modelo: llama-3.3-70b-versatile

La arquitectura debe permitir agregar otros proveedores en el futuro mediante una interfaz común, pero no es necesario implementar fallback automático.

---

# Reglas de Negocio

Estas reglas deben implementarse en el servidor.

## 1. Evitar doble reserva

No puede existir más de un turno con `deletedAt = null` y estado `pendiente` o `confirmado` para el mismo médico que se superponga en el tiempo.

Validar:

```
startTime < existing.endTime AND endTime > existing.startTime
```

La validación debe excluir explícitamente turnos con `deletedAt != null` y turnos en estado `cancelado` o `completado`.

Para evitar condiciones de carrera (dos pacientes reservando el mismo slot simultáneamente), la creación y reprogramación de turnos debe ejecutarse dentro de una transacción de Prisma (`prisma.$transaction`) que revalide el solapamiento antes de confirmar la escritura.

## 2. Duración de turnos

Cada médico puede definir:

`appointmentDurationMinutes`

Valor por defecto:

30 minutos

## 3. Disponibilidad médica

Cada médico posee horarios disponibles semanales, modelados mediante `DoctorAvailability` (ver sección "Base de Datos").

Los turnos solo pueden crearse dentro de esos horarios, calculados como slots concretos a partir de la disponibilidad semanal convertida a UTC para la fecha solicitada.

## 4. Cancelaciones

Un paciente solo puede cancelar:

* Turnos propios.
* Estado pendiente o confirmado.
* Con al menos 2 horas de anticipación.

Este valor debe ser configurable mediante variable de entorno (`CANCELLATION_MIN_HOURS`).

## 5. Reprogramaciones

La reprogramación debe validar nuevamente:

* Disponibilidad.
* Solapamientos.
* Reglas de negocio (incluyendo anticipación mínima y transacción atómica como en la creación).

## 6. Estados válidos

Estados:

* pendiente
* confirmado
* completado
* cancelado

Transiciones permitidas:

* pendiente → confirmado → completado
* pendiente → cancelado
* confirmado → cancelado

No permitir otras transiciones.

## 7. Soft Delete

Pacientes, médicos y turnos deben utilizar:

`deletedAt`

No realizar borrados físicos. Todas las queries por defecto deben filtrar `deletedAt: null`, salvo en vistas administrativas de auditoría/historial si se decide incluirlas.

---

# Roles del Sistema

## Administrador

Puede:

* Gestionar médicos.
* Gestionar pacientes.
* Gestionar turnos.
* Ver dashboard global.
* Ver estadísticas.
* Utilizar recomendaciones IA.

## Médico

Puede:

* Ver agenda.
* Ver pacientes asignados.
* Crear observaciones médicas.
* Consultar historial.
* Utilizar resumen IA.

## Paciente

Puede:

* Registrarse.
* Editar perfil.
* Solicitar turnos.
* Cancelar turnos.
* Reprogramar turnos.
* Consultar historial.
* Recibir mensajes generados por IA.

---

# Mapa de Rutas

```
/
/login
/register

/dashboard

/dashboard/admin
/dashboard/admin/doctors
/dashboard/admin/patients
/dashboard/admin/appointments
/dashboard/admin/ai-insights

/dashboard/doctor
/dashboard/doctor/agenda
/dashboard/doctor/patients/[id]
/dashboard/doctor/notes/[appointmentId]

/dashboard/patient
/dashboard/patient/appointments
/dashboard/patient/appointments/new
/dashboard/patient/history
/dashboard/patient/notifications
```

Implementar middleware con protección por rol.

Agregar página 403 para accesos no autorizados.

---

# Funcionalidades

## Autenticación

Implementar:

* Registro.
* Login.
* Logout.
* Middleware.
* Protección por roles.

El registro público crea usuarios con rol PATIENT.

Los roles ADMIN y DOCTOR se crean únicamente desde administración o mediante seed.

No implementar reseteo de contraseña ni verificación de email; queda explícitamente fuera de alcance.

---

## Gestión de Pacientes

CRUD completo.

Campos mínimos:

* nombre
* apellido
* email
* teléfono
* fechaNacimiento
* deletedAt
* createdAt
* updatedAt

Funcionalidades:

* búsqueda
* filtros
* paginación

---

## Gestión de Médicos

CRUD completo.

Campos:

* nombre
* apellido
* especialidad
* email
* appointmentDurationMinutes

Relación:

Doctor → DoctorAvailability (uno a muchos)

---

## Gestión de Turnos

CRUD completo.

Campos:

* paciente
* médico
* startTime
* endTime
* estado

Funcionalidades:

* crear
* editar
* cancelar
* reprogramar
* búsqueda
* filtros
* paginación

Aplicar todas las reglas de negocio definidas anteriormente.

---

# Dashboard

## Administrador

Mostrar:

* médicos activos
* pacientes registrados
* turnos del día
* turnos del mes

Utilizar Recharts para mostrar:

* turnos por estado
* turnos por mes

## Médico

Mostrar:

* agenda diaria
* próximos pacientes

## Paciente

Mostrar:

* próximos turnos
* historial
* notificaciones generadas (mensajes de IA pendientes de lectura)

---

# Módulo de Inteligencia Artificial

Crear una capa desacoplada ubicada en:

`src/lib/ai`

Implementar una interfaz `AIProvider` para permitir cambiar fácilmente de proveedor en el futuro.

Proveedor inicial:

* Groq
* `llama-3.3-70b-versatile`

Utilizar:

* Vercel AI SDK
* Zod para validar salidas estructuradas

## Función 1: Resumen de Observaciones Médicas

Entrada:

* texto libre de observación médica

Salida:

* resumen
* hallazgos principales
* nivel de urgencia

Validar mediante Zod.

Persistir resultado en base de datos.

## Función 2: Recomendaciones Administrativas

Entrada:

* métricas agregadas del sistema

Salida:

* recomendaciones priorizadas

Validar mediante Zod.

## Función 3: Sugerencia de Horarios

La disponibilidad real debe calcularse exclusivamente desde la base de datos (a partir de `DoctorAvailability` + turnos existentes).

La IA solo puede:

* ordenar opciones válidas
* justificar recomendaciones

Nunca generar horarios inexistentes.

Validar que todos los horarios sugeridos pertenezcan al conjunto calculado por el backend.

## Función 4: Mensajes para Pacientes

Tipos:

* reminder
* cancellation
* reschedule

Entrada:

* nombre
* médico
* fecha
* hora

Salida:

* mensaje generado

Máximo:

300 caracteres

Validar mediante Zod.

### Entrega de mensajes (importante)

Estos mensajes **no se envían por email ni push**. Se generan on-demand cuando ocurre el evento correspondiente (admin/médico cancela o reprograma un turno, o el paciente solicita un recordatorio) y se persisten como `Notification` asociada al paciente, visible en `/dashboard/patient/notifications`. No implementar tareas programadas (cron) ni envío automático.

---

# Persistencia de IA

Crear entidad:

`AIInteraction`

Campos mínimos:

* id
* userId
* feature
* provider
* inputSummary
* outputJson
* createdAt

Registrar cada uso de IA.

Esto permitirá mostrar trazabilidad y documentar el uso de IA en el informe técnico.

---

# Base de Datos

Entidades mínimas:

* User
* Patient
* Doctor
* DoctorAvailability
* Appointment
* MedicalNote
* AIInteraction
* Notification

## DoctorAvailability

Campos mínimos:

* id
* doctorId
* dayOfWeek (0 = domingo ... 6 = sábado)
* startTime (hora local, formato `HH:mm`)
* endTime (hora local, formato `HH:mm`)
* createdAt
* updatedAt

## Notification

Campos mínimos:

* id
* patientId
* type (`reminder` | `cancellation` | `reschedule`)
* message
* read (boolean, default false)
* createdAt

## Índices y constraints sugeridos

* `User.email` único.
* Índice compuesto en `Appointment(doctorId, startTime, endTime)` para optimizar la validación de solapamientos.
* Índice en `Appointment(patientId)` para historial.
* Índice en `DoctorAvailability(doctorId, dayOfWeek)`.

## General

Incluir:

* relaciones
* índices
* timestamps
* soft delete (`deletedAt`) en User/Patient, Doctor, Appointment

Crear script:

`prisma/seed.ts`

Debe generar:

* 1 administrador
* 2 médicos
* 3 pacientes
* horarios configurados (DoctorAvailability)
* turnos de ejemplo

La aplicación debe poder probarse inmediatamente después del seed.

---

# Estructura del Proyecto

```
src/
  app/
  components/
  features/
  actions/
  hooks/
  schemas/
  types/

lib/
  ai/
  auth/
  db/

tests/
  unit/

prisma/
```

Mantener separación clara entre:

* UI
* lógica de negocio
* acceso a datos
* integración IA

---

# Calidad

Aplicar:

* ESLint
* Prettier
* TypeScript Strict

Utilizar:

* Server Components por defecto
* Componentes reutilizables

No utilizar:

* any
* secretos hardcodeados
* lógica duplicada

---

# Testing

Crear tests unitarios para:

* autenticación
* validaciones Zod
* reglas de negocio de turnos (solapamiento, cancelación, reprogramación, transiciones de estado)
* servicios IA mockeados

No realizar llamadas reales a proveedores IA durante los tests.

Para los tests que requieran Prisma Client (reglas de negocio de turnos), usar una base de datos de test efímera (por ejemplo, un servicio Postgres en el propio job de GitHub Actions) o mockear Prisma Client mediante `vi.mock`, de forma que los tests no dependan de `DATABASE_URL` real ni de la base de Neon de producción/desarrollo.

Priorizar calidad de pruebas por encima de porcentaje de cobertura.

---

# CI/CD

Crear workflow GitHub Actions que ejecute:

1. install
2. lint
3. typecheck
4. test
5. build

Debe funcionar sin API keys reales (`GROQ_API_KEY` puede estar vacía o ser un valor dummy; los tests deben mockear el módulo de IA).

Si los tests de reglas de negocio requieren base de datos, el workflow debe levantar un servicio Postgres efímero y correr `prisma migrate deploy` + `prisma db seed` antes de los tests.

---

# Variables de Entorno

```
DATABASE_URL=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

AI_PROVIDER=groq
GROQ_API_KEY=

DEFAULT_TIMEZONE=America/Argentina/Mendoza

CANCELLATION_MIN_HOURS=2
```

---

# README.md

Incluir:

1. Descripción del proyecto.
2. Tecnologías utilizadas.
3. Arquitectura del sistema.
4. Diagrama Mermaid.
5. Instalación local.
6. Variables de entorno.
7. Seed de datos.
8. Ejecución de tests.
9. Despliegue.
10. Uso de IA dentro de la aplicación.

---

# TECHNICAL_REPORT.md

Incluir:

## Herramientas IA utilizadas durante el desarrollo

Ejemplos:

* Antigravity
* ChatGPT
* Claude
* Cursor

## Cómo ayudó la IA

* generación de código
* debugging
* testing
* documentación

## Prompts utilizados

Documentar los principales prompts utilizados.

## Problemas encontrados

Explicar errores y limitaciones detectadas.

## Soluciones aplicadas

Cómo se resolvieron los problemas.

## Arquitectura IA de la aplicación

Explicar:

* AIProvider
* Vercel AI SDK
* Groq
* Zod

---

# Implementación

Una vez aprobada la arquitectura inicial, generar el proyecto por módulos en el siguiente orden:

1. Configuración inicial.
2. Prisma Schema.
3. Seed.
4. Autenticación.
5. CRUD Médicos.
6. CRUD Pacientes.
7. CRUD Turnos.
8. Dashboard.
9. Módulo IA.
10. Tests.
11. CI/CD.
12. README.

Mantener consistencia absoluta entre todos los archivos generados.

No crear funcionalidades fuera de los requisitos especificados.
