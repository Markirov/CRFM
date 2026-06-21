# King Karl's Kürassiers

Comisión de Revisión y Fianza de Mercenarios.  
App de gestión de campaña BattleTech con React + TypeScript + Tailwind v4.

## Setup

```bash
npm install
npm run dev
```

## Deploy a GitHub Pages

1. Crea un repo en GitHub (ej: `warthogs-fleet`)
2. Asegúrate de que `base` en `vite.config.ts` coincide con el nombre del repo:
   ```ts
   base: '/warthogs-fleet/',
   ```
3. Conecta el repo:
   ```bash
   git init
   git remote add origin https://github.com/TU-USUARIO/warthogs-fleet.git
   ```
4. Despliega:
   ```bash
   npm run deploy
   ```
5. En GitHub → Settings → Pages → Source: **Deploy from a branch** → Branch: `gh-pages` → Save

Tu app estará en: `https://TU-USUARIO.github.io/warthogs-fleet/`

### Re-deploy tras cambios

```bash
npm run deploy
```

Esto compila (`npm run build`) y sube `dist/` a la rama `gh-pages` automáticamente.

## Stack

- React 19 + TypeScript
- Tailwind CSS v4 (`@theme` tokens)
- Vite 6
- Zustand (estado global)
- React Router v7 (HashRouter para GitHub Pages)
- Lucide React (iconos)

## Atribuciones y Disclaimers

### SSW (Solaris Skunk Werks) — `data/rules/ssw/` y `data/canon/`

Este proyecto incluye datos canónicos extraídos de **Solaris Skunk Werks** (SSW),
herramienta open source de construcción de unidades BattleTech.

- Repo SSW: https://github.com/Solaris-Skunk-Werks/SolarisSkunkWerks
- Licencias SSW: **BSD** (data files) y **LGPL** (código fuente)
- Datos incluidos: bases de datos de armas, equipo, munición, físicas, quirks,
  pilotos canon, tablas de fuerzas por facción, plantillas y nombres aleatorios.

Estos datos se redistribuyen tal cual bajo sus licencias originales.
Mantén estos disclaimers si redistribuyes este proyecto.

### BattleTech — Propiedad intelectual

**BattleTech**, **MechWarrior**, **Solaris VII**, los nombres de unidades, facciones,
pilotos y universo asociado son marcas registradas y propiedad de **Topps Company, Inc.**
y publicados bajo licencia por **Catalyst Game Labs**.

Este proyecto es una herramienta **fan-made**, **sin ánimo de lucro**,
para uso en partidas y campañas privadas. No está afiliado, patrocinado ni
respaldado por Topps, Catalyst Game Labs ni ninguno de los titulares de derechos.

Si eres titular de derechos y quieres que retiremos contenido específico,
contacta vía issues del repositorio.
