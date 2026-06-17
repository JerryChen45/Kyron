# Kyron Robot Control Center MVP

A desktop-first web application for configuring, starting, monitoring, and reviewing Kyron robot missions. This MVP uses **simulated robot data** with an integration-ready architecture so mock adapters can be swapped for real robot backends without redesigning the UI.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ROBOT_PROVIDER` | `mock` | Robot adapter: `mock` or `api` |
| `VITE_SHOW_DEMO_CONTROLS` | `true` | Show demo control panel |
| `VITE_DETERMINISTIC_DEMO` | `false` | Repeatable demo sequences |
| `VITE_ROBOT_API_URL` | — | Future real robot API base URL |

## Workflow

1. **Robot Overview** — Check Kyron 01 status, health, and module
2. **Mission Setup** — Select field and operation (laser weeding or precision spraying)
3. **Safety Review** — Review route, complete checklist, start mission
4. **Live Monitoring** — Telemetry, map progress, camera, alerts, controls
5. **Operation Review** — Mission results and coverage map
6. **Demo Controls** — Reset, trigger alerts, simulation profiles (dev/presenter only)

## Architecture

```
UI Components → Zustand Store → RobotService Interface → Adapter (Mock | Real)
```

- UI components never import mock JSON directly
- All robot data flows through `RobotService`
- Shared data models are adapter-independent
- Swap `VITE_ROBOT_PROVIDER=api` to use `RealRobotAdapter` (stub)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

## Project Structure

```
src/
  components/     # Reusable UI (map, alerts, layout)
  config/         # App configuration
  models/         # Shared TypeScript data models
  screens/        # Main workflow screens
  services/robot/ # RobotService, MockRobotAdapter, RealRobotAdapter stub
  store/          # Zustand application state
  validation/     # Mission and safety validation (backend-ready)
```

## Build

```bash
npm run build
npm run preview
```

## Safety Notice

This interface is a **simulation** and must not be used to control physical hardware. Physical emergency stops, geofencing, and onboard safety systems remain independent of browser controls.
