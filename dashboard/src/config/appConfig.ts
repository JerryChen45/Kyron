export type RobotProvider = 'mock' | 'api';

export const appConfig = {
  robotProvider: (import.meta.env.VITE_ROBOT_PROVIDER ?? 'mock') as RobotProvider,
  defaultRobotId: 'kyron-01',
  telemetryStaleThresholdMs: 5000,
  commandTimeoutMs: 10000,
  deterministicDemo: import.meta.env.VITE_DETERMINISTIC_DEMO === 'true',
  showDemoControls: import.meta.env.VITE_SHOW_DEMO_CONTROLS !== 'false',
};
