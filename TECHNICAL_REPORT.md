# Reporte Técnico: Arquitectura, Gestión de Configuración y Desarrollo Asistido por IA

**Proyecto:** MediTurnos — Sistema Integrador de Gestión de Turnos Médicos  
**Entorno de Desarrollo:** Local Estricto (SQLite / Configuración Cero)  
**Fecha:** Junio de 2026  

---

## 1. Resumen Ejecutivo

Este reporte explica cómo diseñamos y programamos **MediTurnos**, una plataforma web para gestionar turnos médicos de forma eficiente. El sistema fue construido usando **Next.js 15 (App Router)** para conectar el frontend con el backend de manera moderna. 

Para que la aplicación sea totalmente estable y no pierda información ni permita errores de datos, usamos el ORM **Prisma**, el motor de base de datos **SQLite** (configurado de forma local para que sea fácil de probar en cualquier máquina) y validaciones estrictas con **Zod** y **TypeScript**. 

Además, implementamos un flujo de trabajo basado en **Desarrollo Asistido por Inteligencia Artificial**, usando modelos avanzados tanto para escribir el código como para generar funciones inteligentes dentro de la misma aplicación (como la creación de mensajes personalizados para los pacientes).

---

## 2. Decisiones de Diseño de Datos (Prisma y Base de Datos)

Para cumplir con los requerimientos de la materia y asegurar que el proyecto sea portátil (que el profesor lo pueda clonar y correr sin configurar servidores externos), elegimos **SQLite**. La estructura de las tablas se diseñó siguiendo estas tres reglas clave:

* **Borrados Lógicos (Soft Deletes)**: Para no perder el historial de turnos ni los datos de los pacientes (requisito importante en sistemas de salud), ninguna fila se borra del todo. Usamos un campo llamado `deletedAt`. Si tiene una fecha, el sistema sabe que el registro está oculto, pero la información sigue guardada para auditorías.
* **Tabla de Usuarios Unificada**: Creamos una sola tabla llamada `User` para manejar los inicios de sesión (email y contraseña). Esta tabla se conecta de forma opcional (relación 1:1) con la tabla `Doctor` o `Patient`. Así evitamos tener correos duplicados y centralizamos la seguridad.
* **Reprogramaciones Inmutables**: Cuando un paciente cambia la fecha de un turno, el sistema no edita el turno viejo. En lugar de eso, cancela el turno original y crea uno nuevo. Ambos turnos se enlazan con el campo `rescheduledFromId`. De esta forma, queda un registro claro de todo el historial del turno.

---

## 3. Seguridad y Control de Acceso basado en Roles (RBAC)

La seguridad del sistema está dividida según quién inicie sesión (**Administrador, Médico o Paciente**). Para esto usamos **Auth.js v5 (NextAuth)** con una estrategia de tokens **JWT** (JSON Web Tokens).

Cuando un usuario inicia sesión, el sistema guarda su rol y sus IDs correspondientes (`role`, `doctorId`, `patientId`) dentro del token cifrado. Cada vez que el frontend ejecuta una acción en el servidor (*Server Action*), el backend lee este token de forma automática y verifica si el usuario tiene permiso para hacer esa tarea antes de tocar la base de datos.

---

## 4. Gestión de Concurrencia (Evitar Doble Reserva de Turnos)

Uno de los problemas más importantes que resolvimos fue evitar que dos personas reserven el mismo turno con el mismo médico al mismo tiempo. Lo solucionamos en dos niveles:

### 1. Control Preventivo (Frontend)
La interfaz del usuario consulta los horarios disponibles del médico (`DoctorAvailability`) y resta los turnos que ya están ocupados. Usamos la librería `date-fns-tz` para asegurarnos de que los horarios se calculen bien, sin importar la zona horaria de la computadora donde se use.

### 2. Control Atómico (Backend)
Cuando se intenta guardar el turno en la base de datos, el servidor encierra la operación dentro de una **transacción de Prisma** (`$transaction`). El sistema busca si el turno ya fue tomado justo un milisegundo antes; si encuentra una coincidencia, frena todo, cancela la operación y manda un error seguro al usuario.

## 5. Diseño del Módulo de IA (Generación de Mensajes On-Demand)

El dominio de la aplicación delega la comunicación proactiva en un módulo de Inteligencia Artificial **On-Demand** (a demanda) integrado mediante el **Vercel AI SDK** y la API de **Groq**, ejecutando el modelo de código abierto de última generación **`llama-3.3-70b-versatile`**.

Cuando un administrador o médico altera el flujo normal de la agenda (como la cancelación abrupta de un turno), el sistema dispara de forma sincrónica una petición al proveedor de IA. Para asegurar la confiabilidad del sistema, la respuesta del modelo es forzada y parseada mediante esquemas estructurados de **Zod**, impidiendo alucinaciones en el formato. El mensaje resultante se almacena en la entidad de auditoría `AIInteraction` y se entrega a la interfaz de usuario de manera inmediata, omitiendo el uso de costosos o complejos procesos asíncronos en segundo plano (*Cron Jobs*).

---

## 6. Herramientas de IA utilizadas como Co-piloto

Durante el proceso de desarrollo e ingeniería de software, utilizamos **Gemini 2.5 Pro** a través del agente autónomo **Antigravity**, el cual estuvo integrado dentro de nuestro entorno de trabajo en **Open Design CLI**. Esta combinación funcionó como nuestro asistente principal de programación, ayudándonos a tomar decisiones técnicas rápidas, diseñar la estructura de la base de datos local y solucionar errores en el código.

---

## 7. Impacto de la IA en el Desarrollo del Proyecto

El uso de la IA como co-piloto afectó positivamente cuatro áreas clave del desarrollo:

* **Escritura de Código**: Nos ayudó a generar rápidamente más de 30 funciones de servidor (*Server Actions*), los esquemas de validación de datos de Zod y la estructura visual de las pantallas usando componentes de Shadcn.
* **Resolución de Errores (Debugging)**: Detectó fallas lógicas cuando calculábamos los horarios de los médicos y nos ayudó a actualizar el código cuando el proveedor de IA cambió sus herramientas.
* **Creación de Pruebas (Testing)**: Diseñó la suite de pruebas unitarias en **Vitest** usando componentes simulados (*mocks*). Esto nos permite probar que las funciones andan bien sin necesidad de conectarnos a internet ni a bases de datos reales.
* **Documentación Técnica**: Nos asistió en el armado del archivo de instrucciones (`README.md`), los comentarios explicativos dentro del código y la redacción de este reporte.

---

## 8. Catálogo de Prompts Utilizados (Ingeniería de Prompts)

Para que la IA nos diera las respuestas exactas que necesitábamos para la materia, usamos diferentes estrategias de prompts:

| Objetivo del Prompt | Estrategia Aplicada | Restricciones dadas a la IA |
| :--- | :--- | :--- |
| **Diseño del Sistema** | Prompt Maestro Inicial con todo el contexto del problema. | Se le prohibió permitir turnos duplicados y se le exigió usar SQLite y roles de usuario. |
| **Limpieza de Tablas** | Prompt de refactorización de base de datos. | Se le ordenó unificar la seguridad en la tabla `User` y quitar tablas innecesarias. |
| **Agenda del Médico** | Prompt para actualizar horarios (`updateDoctorAvailability`). | Se le exigió que borrara los horarios viejos y metiera los nuevos dentro de una sola transacción para evitar datos a medias. |
| **Actualización de Modelos** | Prompt de actualización de librerías. | Se le pasó el error 400 de la consola para que cambiara el modelo viejo de Groq (`llama-3.1`) por el nuevo (`llama-3.3`). |

---

## 9. Matriz de Errores Encontrados y Soluciones (QA Log)

| Problema / Error detectado | Causa del Error | Solución Aplicada |
| :--- | :--- | :--- |
| **Error 400 en la API de IA** | Groq dio de baja el modelo viejo `llama-3.1` mientras programábamos. | Cambiamos el archivo `src/lib/ai/groq.ts` para apuntar al nuevo modelo `llama-3.3-70b-versatile`. |
| **Lentitud al cargar el historial (Query N+1)** | El sistema hacía una consulta a la base de datos en bucle por cada turno reprogramado para buscar su fecha original. | Modificamos la función `getPatientAppointmentHistory` para que junte todos los IDs primero y haga una sola consulta masiva usando el operador `{ in: ids }`. |
| **Fallo en los Tests Unitarios** | Las pruebas de Vitest fallaban porque los simuladores (*mocks*) no entendían las transacciones complejas de Prisma. | Reescribimos el archivo de pruebas `src/__tests__/appointments.test.ts` para simular que la transacción devuelve las promesas de forma directa. |
| **Bucle infinito en el navegador (Error 307)** | Firefox se bloqueaba porque Auth.js no encontraba la clave secreta local para validar la sesión. | Creamos un script automático llamado `postinstall` en el `package.json` que clona el archivo `.env.example` en un `.env` real antes de que el servidor encienda. |

---

## 10. Lecciones Aprendidas y Conclusiones

Este proyecto integrador nos demostró que programar junto a una Inteligencia Artificial acelera muchísimo los tiempos de entrega, pero requiere que los programadores humanos tengan muy claro el diseño de la arquitectura antes de empezar a pedir código. Escribir un "Prompt Maestro" al principio funcionó como un contrato que evitó que la IA se desviara del objetivo de la materia.

Finalmente, aprendimos la importancia de la **Gestión de Configuración**. Automatizar el proyecto para que se configure solo con `npm install` usando SQLite nos asegura que cualquier persona (incluido el profesor para evaluarnos) pueda descargar el código y ponerlo a funcionar en su computadora en dos pasos, sin errores de instalación y con datos de prueba listos para usar.