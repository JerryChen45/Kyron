# Architecture Documentation

## Overview

The Kyron Robot Control Center follows a layered architecture designed for future real-robot integration:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  RobotOverview · MissionSetup · SafetyReview ·          │
│  LiveMonitoring · OperationReview · DemoControlPanel    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Application State (Zustand)                 │
│  robotStore — selected field, mission, telemetry, alerts  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Robot Service Interface                       │
│  getRobotStatus · createMission · startMission ·         │
│  subscribeToTelemetry · subscribeToAlerts · …            │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│ MockRobotAdapter │           │ RealRobotAdapter │
│ (MVP — active)   │           │ (future stub)    │
└──────────────────┘           └─────────┬────────┘
                                         │
                               ┌─────────▼─────────┐
                               │  Secure Backend   │
                               │  Robot Gateway    │
                               └─────────┬─────────┘
                                         │
                               ┌─────────▼─────────┐
                               │  Physical Robot   │
                               └───────────────────┘
```

## Key Design Decisions

### 1. Robot Service Abstraction

All robot interactions go through `RobotService` (`src/services/robot/RobotService.ts`). The UI and store call `getRobotService()` — never `MockRobotAdapter` directly.

Adapter selection is configuration-driven:

```ts
VITE_ROBOT_PROVIDER=mock  // MVP
VITE_ROBOT_PROVIDER=api   // Future production
```

### 2. No Mock Data in UI

Mock field definitions, routes, and robot state live in `src/services/robot/mockData.ts` and are consumed only by `MockRobotAdapter`. UI components obtain data via the store, which calls the service.

### 3. Shared Data Models

Types in `src/models/` define the contract between adapters and the application:

- `robot.ts` — RobotStatus, RobotTelemetry, RobotAlert, CommandResult
- `mission.ts` — MissionConfig, Mission, MissionResult, FieldBoundary

These models use consistent units (meters, m/s, ISO 8601 timestamps, percentage battery).

### 4. Event-Driven Telemetry

`subscribeToTelemetry()` provides a streaming interface. The mock adapter uses `setInterval`; a future real adapter may use WebSocket, SSE, or MQTT.

The store tracks `telemetryHealth` and detects stale data when updates stop arriving.

### 5. Command Acknowledgement

Every command returns a `CommandResult` with status progression:

`pending → acknowledged → accepted | rejected → completed | failed | timed_out`

The UI shows pending states and prevents duplicate submissions.

### 6. Validation Separation

`src/validation/missionValidation.ts` implements start conditions independently of UI components. This logic can later be replaced or extended by backend validation.

### 7. Camera Source Abstraction

`CameraPanel` accepts a `CameraSource` prop (`placeholder`, `video`, `webrtc`, `hls`, `mjpeg`). The mock uses a placeholder; real streams plug in without UI changes.

## Future Integration Path

1. Preserve existing UI and store
2. Implement backend robot gateway (REST + WebSocket)
3. Complete `RealRobotAdapter` methods with API calls
4. Add authentication and command authorization
5. Set `VITE_ROBOT_PROVIDER=api`

The browser never needs ROS topic names or low-level motor commands — those remain behind the backend.

## Testing Strategy

`setRobotService()` in `src/services/robot/index.ts` allows dependency injection for tests:

```ts
setRobotService(new MockRobotAdapter());
// or a custom test double implementing RobotService
```

## Demo Controls

`DemoControls` interface on `MockRobotAdapter` provides presenter tools:

- Reset simulation
- Complete mission immediately
- Trigger alerts and connection loss
- Select simulation profiles

Hidden in production via `VITE_SHOW_DEMO_CONTROLS=false`.
