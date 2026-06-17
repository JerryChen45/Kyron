import type { FieldBoundary, PlannedRoute } from '../../models/mission';
import type { RobotModule } from '../../models/robot';

export const MOCK_ROBOT = {
  robotId: 'kyron-01',
  name: 'Kyron 01',
  model: 'Kyron Field Unit v1',
  location: 'Base station',
};

export const MOCK_MODULES: Record<string, RobotModule> = {
  'module-laser-01': {
    moduleId: 'module-laser-01',
    name: 'Laser-weeding module',
    type: 'laser_weeding',
    connectionStatus: 'connected',
    readinessState: 'ready',
    consumableLevelPercent: 100,
  },
  'module-spray-01': {
    moduleId: 'module-spray-01',
    name: 'Precision-spraying module',
    type: 'precision_spraying',
    connectionStatus: 'connected',
    readinessState: 'ready',
    consumableLevelPercent: 72,
  },
};

export const MOCK_FIELDS: FieldBoundary[] = [
  {
    fieldId: 'field-north-01',
    name: 'North Vineyard Block A',
    areaHectares: 2.4,
    cropType: 'Cabernet Sauvignon',
    entryPoint: { latitude: 38.2975, longitude: -122.2865, order: 0 },
    boundary: [
      { latitude: 38.2970, longitude: -122.2875, order: 0 },
      { latitude: 38.2985, longitude: -122.2875, order: 1 },
      { latitude: 38.2985, longitude: -122.2855, order: 2 },
      { latitude: 38.2970, longitude: -122.2855, order: 3 },
    ],
    restrictedZones: [
      [
        { latitude: 38.2978, longitude: -122.2868, order: 0 },
        { latitude: 38.2980, longitude: -122.2868, order: 1 },
        { latitude: 38.2980, longitude: -122.2864, order: 2 },
        { latitude: 38.2978, longitude: -122.2864, order: 3 },
      ],
    ],
  },
  {
    fieldId: 'field-south-02',
    name: 'South Orchard Block B',
    areaHectares: 1.8,
    cropType: 'Apple (Gala)',
    entryPoint: { latitude: 38.2940, longitude: -122.2840, order: 0 },
    boundary: [
      { latitude: 38.2935, longitude: -122.2850, order: 0 },
      { latitude: 38.2948, longitude: -122.2850, order: 1 },
      { latitude: 38.2948, longitude: -122.2830, order: 2 },
      { latitude: 38.2935, longitude: -122.2830, order: 3 },
    ],
    restrictedZones: [
      [
        { latitude: 38.2942, longitude: -122.2845, order: 0 },
        { latitude: 38.2944, longitude: -122.2845, order: 1 },
        { latitude: 38.2944, longitude: -122.2841, order: 2 },
        { latitude: 38.2942, longitude: -122.2841, order: 3 },
      ],
    ],
  },
];

function generateBoustrophedonRoute(
  field: FieldBoundary,
  rows: number,
): PlannedRoute['points'] {
  const [sw, , ne] = [
    field.boundary[0],
    field.boundary[1],
    field.boundary[2],
  ];
  const points: PlannedRoute['points'] = [];
  let order = 0;
  for (let i = 0; i < rows; i++) {
    const t = (i + 1) / (rows + 1);
    const lat = sw.latitude + (ne.latitude - sw.latitude) * t;
    const left = { latitude: lat, longitude: sw.longitude + 0.0002, order: order++ };
    const right = { latitude: lat, longitude: ne.longitude - 0.0002, order: order++ };
    if (i % 2 === 0) {
      points.push(left, right);
    } else {
      points.push(right, left);
    }
  }
  return points;
}

export const MOCK_ROUTES: Record<string, PlannedRoute> = {
  'route-weeding-north': {
    routeId: 'route-weeding-north',
    fieldId: 'field-north-01',
    operationType: 'laser_weeding',
    points: generateBoustrophedonRoute(MOCK_FIELDS[0], 8),
    treatmentZones: MOCK_FIELDS[0].restrictedZones,
    estimatedDistanceMeters: 1240,
    estimatedDurationMinutes: 45,
  },
  'route-spraying-south': {
    routeId: 'route-spraying-south',
    fieldId: 'field-south-02',
    operationType: 'precision_spraying',
    points: generateBoustrophedonRoute(MOCK_FIELDS[1], 6),
    treatmentZones: MOCK_FIELDS[1].restrictedZones,
    estimatedDistanceMeters: 980,
    estimatedDurationMinutes: 38,
  },
};

export type SimulationProfile =
  | 'successful_mission'
  | 'low_battery_warning'
  | 'obstacle_detected'
  | 'connection_loss'
  | 'module_fault'
  | 'partial_mission'
  | 'emergency_stop';

export const SIMULATION_PROFILES: { id: SimulationProfile; label: string; description: string }[] = [
  { id: 'successful_mission', label: 'Successful mission', description: 'Clean run to 100% completion' },
  { id: 'low_battery_warning', label: 'Low battery warning', description: 'Battery drops below 20% mid-mission' },
  { id: 'obstacle_detected', label: 'Obstacle detected', description: 'Obstacle alert during operation' },
  { id: 'connection_loss', label: 'Connection loss', description: 'Telemetry interruption simulated' },
  { id: 'module_fault', label: 'Module fault', description: 'Module fault alert and pause' },
  { id: 'partial_mission', label: 'Partial mission', description: 'Mission ends at ~65% progress' },
  { id: 'emergency_stop', label: 'Emergency stop', description: 'E-stop activated during mission' },
];
