# Reporte Técnico - Arquitectura y Desarrollo Asistido por IA

## 1. Resumen Ejecutivo
El presente documento detalla las decisiones arquitectónicas clave implementadas en el desarrollo de "MediTurnos". El sistema fue construido bajo Next.js 15, garantizando robustez y consistencia de datos mediante Server Actions atómicos, Prisma ORM y tipado estricto extremo a extremo con Zod y TypeScript.

## 2. Decisiones de Diseño de Datos (Prisma)
- **Soft Deletes Activos**: Para mantener el cumplimiento de normativas de salud e historial de auditoría, las entidades críticas (`User`, `Patient`, `Doctor`, `Appointment`) utilizan el campo `deletedAt`.
- **Normalización de Usuarios**: Se implementó una única tabla `User` vinculada a perfiles opcionales 1:1 (`Doctor`, `Patient`). Esto previene duplicado de correos e inconsistencias de sesión.
- **Trazabilidad Inmutable**: En la reprogramación, se cancela el turno original y se genera uno nuevo utilizando el puntero `rescheduledFromId`.

## 3. Seguridad y Control de Acceso (RBAC)
La autenticación (vía Auth.js JWT) incrusta el `role`, `doctorId` y `patientId` directamente en el token. Cada Server Action valida implícitamente los permisos antes de abrir la transacción de base de datos.

## 4. Gestión de Concurrencia en Reservas
1. **Frontend preventivo**: La UI cruza la agenda semanal ideal (`DoctorAvailability`) contra los turnos activos en tiempo real (`getAvailableSlots` convierte a UTC vía `date-fns-tz`).
2. **Backend reactivo**: Se utiliza `prisma.$transaction`. Se hace un `findFirst` atómico verificando superposiciones; si existe, se genera un aborto seguro de la transacción.

## 5. Diseño del Módulo de IA (Generación On-Demand)
Se optó por una arquitectura *On-Demand* apoyada en el ecosistema **Vercel AI SDK**, validación **Zod** y **Groq** (`llama-3.3-70b-versatile`).
Cuando un usuario dispara una acción (ej. cancelar un turno), se invoca al `AIProvider`. El mensaje generado es estrictamente parseado con esquemas Zod (para evitar alucinaciones en la estructura) y se registra en `AIInteraction`, devolviendo la notificación instantánea al usuario sin necesidad de Cron Jobs pesados.

---

## 🤖 6. Herramientas IA utilizadas durante el desarrollo
- **Antigravity (Google DeepMind)**: Agente autónomo de codificación utilizado para planificar la arquitectura, generar código de extremo a extremo (frontend, backend, testing), debugear errores y escribir los tests unitarios.

## 🧠 7. Cómo ayudó la IA
- **Generación de Código**: Escribió más de 30 Server Actions, schemas de Zod, e interfaces Shadcn completas en Next.js App Router basándose exclusivamente en el Prompt Maestro.
- **Debugging**: Detectó en tiempo real errores como solapamientos lógicos al crear franjas horarias y ajustó el modelo obsoleto de Groq.
- **Testing**: Construyó una suite Mockeada en Vitest sin requerir servicios externos, levantando mocks para Prisma Client y Vercel AI SDK que aceleran el CI/CD en GitHub Actions.
- **Documentación**: Redactó informes técnicos, explicaciones detalladas y comentarios en el código que cumplen con estándares arquitectónicos de primer nivel.

## 📝 8. Prompts utilizados (Ejemplos Clave)
A lo largo del proyecto, la IA fue guiada mediante directrices estructurales (Prompts):
1. **Prompt Maestro Inicial**: Definió el dominio clínico, la mitigación obligatoria de doble reservas, la inmutabilidad en reprogramaciones y el modelo RBAC.
2. **Ajustes de Aprobación de Schema**: Validó que `Notification` quedase fuera del schema de la base de datos (priorizando logs en `AIInteraction` on-demand) y unificó la tabla de `User`.
3. **Validaciones de DoctorAvailability**: Exigió que se crearan lógicas Zod preventivas y acciones de limpieza / reinserción total para sincronizar los slots semanales del doctor (`updateDoctorAvailability`).
4. **Actualización de Modelo Deprecado**: Solicitud crítica de migrar todo el código de `llama-3.1-70b-versatile` a `llama-3.3-70b-versatile` ante errores 400.

## 🚧 9. Problemas Encontrados
- **Modelo de IA Deprecado**: Durante el desarrollo, Groq deprecó el modelo `llama-3.1-70b-versatile`, lo que impedía el funcionamiento del `AIProvider`.
- **Query N+1 en Reprogramaciones**: Al intentar listar el historial del paciente, si se quería mostrar la fecha original de un turno reprogramado (usando `rescheduledFromId`), el ORM requería hacer una query en loop por cada turno.
- **Mockeo de Transacciones en Prisma**: Al implementar la suite de tests (`vitest-mock-extended`), las consultas encadenadas de Prisma `$transaction` fallaban al carecer del objeto Prisma anidado en el mock.

## ✅ 10. Soluciones Aplicadas
- **Solución Modelo Deprecado**: Se refactorizó la capa en `src/lib/ai/groq.ts` para usar la API actual `llama-3.3-70b-versatile`.
- **Solución N+1**: En `getPatientAppointmentHistory`, se aplicó optimización batcheada, extrayendo todos los `rescheduledFromId` y realizando una única búsqueda `prisma.appointment.findMany({ where: { id: { in: rescheduledIds } } })`.
- **Solución Mocks Prisma**: Se reescribió la interceptación de `$transaction` en `src/__tests__/appointments.test.ts` devolviendo directamente el propio mock de `prisma` y forzando que devuelva promesas simuladas.

## 💡 11. Lecciones Aprendidas
*(Borrador para el autor)*
Desarrollar un sistema acoplado con IA y reglas de negocio estrictas asistido por Antigravity demostró la potencia de planificar fuertemente antes de codificar. Tener un "Prompt Maestro" bien acotado previene la desviación de características (Feature Creep) en los agentes. Además, mantener un estándar de "100% Mocks" para las reglas transaccionales reduce la fricción operativa durante el desarrollo local, enfocando el esfuerzo en la arquitectura y la experiencia de usuario.
