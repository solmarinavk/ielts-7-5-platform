# IELTS 7.5 Platform

PWA personalizada para preparar IELTS Academic 7.5 en 45 días. Sin backend: todo el estado vive en IndexedDB del dispositivo. Pensado mobile-first, instalable en home screen.

## Estado: Sprint 1

Listo:

- Vite + React + Tailwind + react-router + Dexie + vite-plugin-pwa
- Schema de IndexedDB completo (todas las tablas del brief)
- Plan generator de 45 días con 5 fases (Diagnóstico, Construcción, Simulacros, Refinamiento, Taper)
- Settings: fecha del examen, target band, targets por sección, tema (claro/oscuro/sistema)
- Home dashboard: saludo, días al examen, energy meter, DayCard con bloques chequeables
- Plan view: grilla 5×9 con colores por fase y detalle del día
- BottomNav, TopBar, InstallPrompt para iOS
- Soft prompt para Add to Home Screen en iOS
- Placeholders para Vocab, Mocks, Writing, Speaking, Errors, Tracking, Export (sprints siguientes)
- `_redirects` para SPA en Netlify
- Manifest + iconos 192/512/maskable

## Correr local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173. La primera vez la app crea las settings por defecto y te pide la fecha del examen.

## Build

```bash
npm run build
npm run preview
```

## Deploy Netlify

Drag & drop de `dist/` en https://app.netlify.com/drop, o conectá el repo. El `public/_redirects` ya redirige todo a `index.html` (SPA).

## Qué testear primero

1. Abrir `/` → ver el banner "Configurá tu fecha de examen" y la quick stats vacía.
2. Ir a `/settings`, poner una fecha del examen, guardar. Verificar que el plan se genera.
3. Volver a Home → ver DayCard con los bloques del día (si hoy cae dentro de los 45 días previos).
4. Marcar un bloque como hecho. Verificar que persiste al recargar (IndexedDB).
5. Ir a `/plan` → ver la grilla 5×9 con fases coloreadas. Click en un día abre el detalle.
6. Cambiar tema (claro/oscuro/sistema) en Settings.
7. Build + preview, instalar como PWA en Android Chrome o agregar al home screen en iOS Safari.

## Decisiones tomadas que puede que quieras cambiar

- **Default exam date**: hoy + 45 días. Cambialo en `/settings`.
- **Default sectionTargets**: Listening 7.5, Reading 7.5, Writing 7.0, Speaking 7.5.
- **Mock days en fase Simulacros**: días 21, 23, 25, 28, 30, 32, 35 (3 mocks por semana, lunes/miércoles/viernes lógicos dentro del bloque). Re-generar respeta este patrón.
- **Iconos**: SVG con "7.5" gradient slate→indigo, generados como PNG a 192/512. Cuando tengas un logo final, reemplazá `public/icons/icon.svg` y re-corré la conversión.
- **Plan template**: días 1-4, 43-45 son explícitos. Días 5-42 se generan por fase + rotación de skill. La estructura está lista, los textos se afinan en sprints siguientes.

## Próximo: Sprint 2

- SRS de vocabulario (SM-2) + seed AWL
- Registro de mocks + error log automático
- Vista de errores con filtros
