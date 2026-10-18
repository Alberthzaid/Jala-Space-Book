# BookSpace Library

Interfaz web para el área de lectores de una biblioteca. Usa datos reales del catálogo abierto de [Open Library](https://openlibrary.org) para buscar y consultar libros, y [Supabase](https://supabase.com) para las cuentas de usuario, los préstamos, las reservas y el historial.

> **Captura de pantalla:** pendiente. Añade una imagen en `docs/screenshot.png` y enlázala aquí.

## Funcionalidades

| Pantalla | Ruta | Qué incluye |
| --- | --- | --- |
| Inicio | `/` | Tendencias del día y estanterías por materia de Open Library. |
| Catálogo | `/catalogo?q=&subject=&sort=&page=` | Búsqueda en el servidor con espera de 400 ms al escribir, filtro por materia, paginación real y estado de disponibilidad de cada libro. Orden por relevancia, más recientes, más antiguos, título (A-Z), autor (A-Z) y mejor valorados. El estado de la búsqueda vive en la URL. |
| Detalle de libro | `/libro/:id` | Portada, autores, descripción, materias, libros relacionados, estado de lectura y panel de préstamo: **Pedir prestado**, **Reservar**, **Renovar** y **Devolver**. |
| Mi lista | `/mi-lista` | Lista de lectura (Quiero leer, Leyendo, Leído) guardada en el navegador. |
| Iniciar sesión / Crear cuenta | `/login`, `/registro` | Formularios validados en el cliente con errores accesibles junto a cada campo. |
| Mis préstamos | `/prestamos` (requiere sesión) | Pestañas Activos, Reservas e Historial. Sin sesión redirige a `/login?next=/prestamos`. |

Las rutas desconocidas muestran una página 404.

### Reglas de préstamo

- **Una copia por obra:** solo una persona puede tener cada libro a la vez. Lo garantiza la base de datos con un índice único, no solo la interfaz.
- Préstamos de **14 días**, con **una renovación de 7 días**. No se puede renovar un préstamo vencido ni un libro que otra persona reservó.
- Máximo **5 préstamos activos** por persona.
- Solo se puede reservar un libro que tiene otra persona (o ponerse en cola detrás de reservas anteriores). Cuando se devuelve, cualquiera de quienes lo reservaron puede pedirlo; el resto ve el estado **Reservado**.
- Disponibilidad visible en tarjetas y detalle: **Disponible**, **Prestado hasta dd/mm** o **Reservado**. Nunca se muestra quién tiene el libro.

### Avisos de disponibilidad

Al cargar la app, y cada 60 segundos mientras la pestaña está visible, se revisan las reservas activas y los libros de "Quiero leer". Cuando uno vuelve a estar disponible aparece un aviso accesible (`role="status"`) y un contador en la cabecera. Las reservas avisadas se marcan en la base de datos (`notified_at`) para no repetir el aviso.

## Stack

- React 18 + TypeScript
- Vite 5 (rutas cargadas con `React.lazy` + `Suspense`)
- Tailwind CSS 3 + shadcn/ui (Radix UI)
- React Router 6 (`BrowserRouter`)
- Supabase (Auth + Postgres con Row Level Security) mediante `@supabase/supabase-js`
- Vitest para pruebas unitarias
- lucide-react para iconos

## Arquitectura

- **Organización por funcionalidad:** `src/features/{auth,catalog,dashboard,loans,notifications,reading-list}`. Lo reutilizable vive en `src/shared`, que nunca importa features (por ejemplo, los contadores del menú llegan como props desde `App`).
- **Configuración:** `src/shared/config/env.ts` lee y valida `import.meta.env`. Si faltan las variables de Supabase, la app sigue funcionando y las partes de cuentas y préstamos muestran "Configuración de Supabase pendiente".
- **Clientes de API:** `src/shared/api/openLibrary.ts` (Open Library) y `src/shared/api/supabase.ts` (cliente único de Supabase).
- **Lógica pura probada:** validación de formularios, redirección segura tras el login, reglas de préstamo (`loanRules.ts`), mapeo de la disponibilidad, repositorio de préstamos con un cliente Supabase simulado, orden por autor, avisos de disponibilidad y lectura del entorno.

## Seguridad

- React escapa todo el contenido y no se usa `dangerouslySetInnerHTML`.
- La búsqueda se recorta y se limita a 200 caracteres; los identificadores de obra se validan (`OL…W`).
- Solo HTTPS para Open Library y Supabase.
- Supabase Auth (contraseñas con bcrypt en el servidor, sesiones con JWT) y Row Level Security: cada persona solo lee y modifica sus filas. Las fechas y las reglas las decide la base de datos mediante triggers.
- `?next=` solo acepta rutas internas (empiezan por `/`, no por `//`), lo que evita redirecciones abiertas.

## Requisitos

- Node.js 18 o superior
- npm
- Un proyecto de Supabase para cuentas y préstamos

## Instalación y scripts

```bash
npm install
cp .env.example .env.local   # y completa los valores de Supabase
npm run dev
```

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run test` | Ejecuta las pruebas unitarias con Vitest. |
| `npm run typecheck` | Verificación de tipos con TypeScript. |
| `npm run build` | Verifica tipos y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la versión de producción. |

## Variables de entorno

| Variable | Dónde | Descripción |
| --- | --- | --- |
| `VITE_OPEN_LIBRARY_BASE_URL` | `.env.development`, `.env.production` | URL base de Open Library (`https://openlibrary.org`). No es secreta. |
| `VITE_SUPABASE_URL` | `.env.local` y Vercel | URL del proyecto de Supabase. |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` y Vercel | Clave pública `anon`. Es pública por diseño; los datos los protege RLS. |

`.env.local` y `.env*.local` están en `.gitignore`. `.env.example` documenta todas las variables.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql). Crea las tablas `loans` y `reservations`, las políticas RLS, el índice de una copia por obra, los triggers de reglas y la función `get_availability`. El script se puede ejecutar de nuevo sin problemas.
3. En **Authentication → Providers → Email**, desactiva **Confirm email** para que el registro funcione al instante en la demo. Si lo dejas activo, la app pide confirmar el correo antes de iniciar sesión.
4. En **Project Settings → API**, copia la URL del proyecto y la clave `anon` en `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y reinicia `npm run dev`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel; detecta Vite automáticamente.
2. Comando de build: `npm run build`. Directorio de salida: `dist`.
3. En **Settings → Environment Variables**, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. `vercel.json` redirige todas las rutas a `index.html`, de modo que las URLs profundas (por ejemplo `/libro/OL27482W`) funcionan al recargar.

## Estructura del proyecto

```text
src/
├── app/                 # Punto de entrada, App y rutas (React.lazy)
├── features/
│   ├── auth/            # AuthProvider, login, registro, ProtectedRoute, validación
│   ├── catalog/         # Catálogo, detalle, orden por autor
│   ├── dashboard/       # Inicio
│   ├── loans/           # LoansProvider, repositorio Supabase, reglas, disponibilidad, Mis préstamos
│   ├── notifications/   # Avisos de disponibilidad (polling)
│   └── reading-list/    # Mi lista (localStorage)
└── shared/
    ├── api/             # Clientes de Open Library y Supabase
    ├── config/          # Lectura y validación del entorno
    ├── components/      # BookCard, BookGrid, BookCover, estados de carga y error
    ├── hooks/           # useAsync, useDebouncedValue, useVisiblePolling
    ├── layout/          # Sidebar, header y navegación
    ├── lib/             # Rutas, materias y utilidades
    └── ui/              # Componentes shadcn/ui
supabase/
└── schema.sql           # Tablas, RLS, triggers y RPC de disponibilidad
```


## Dev

Zaid Pantoja
