import type { MissionConfig, SafetyChecklistItem } from '../models/mission';
import type { RobotStatus } from '../models/robot';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export const DEFAULT_SAFETY_CHECKLIST: SafetyChecklistItem[] = [
  { id: 'field_clear', label: 'The field is clear of people', checked: false, required: true },
  { id: 'boundary_reviewed', label: 'The operating boundary has been reviewed', checked: false, required: true },
  { id: 'module_attached', label: 'The correct module is attached', checked: false, required: true },
  { id: 'estop_checked', label: 'The emergency stop has been checked', checked: false, required: true },
  { id: 'battery_sufficient', label: 'The robot has sufficient battery', checked: false, required: true },
  { id: 'consumables_available', label: 'Required consumables are available', checked: false, required: true },
  { id: 'operator_authorized', label: 'The operator is authorized to start the mission', checked: false, required: true },
];

export function validateSafetyChecklist(items: SafetyChecklistItem[]): ValidationResult {
  const errors = items
    .filter((item) => item.required && !item.checked)
    .map((item) => `Safety check incomplete: ${item.label}`);
  return { valid: errors.length === 0, errors };
}

export function validateMissionStart(
  robotStatus: RobotStatus | null,
  config: MissionConfig | null,
  safetyChecklist: SafetyChecklistItem[],
): ValidationResult {
  const errors: string[] = [];

  if (!robotStatus) {
    errors.push('Robot status unavailable');
    return { valid: false, errors };
  }

  if (robotStatus.connectionState !== 'online') {
    errors.push('Robot is not online');
  }

  if (robotStatus.operatingState !== 'ready' && robotStatus.operatingState !== 'preparing') {
    errors.push(`Robot is not ready (current state: ${robotStatus.operatingState})`);
  }

  if (robotStatus.batteryPercent < 20) {
    errors.push('Battery level is below minimum (20%)');
  }

  if (robotStatus.health.emergencyStopActive) {
    errors.push('Emergency stop is active');
  }

  if (!config) {
    errors.push('Mission configuration is missing');
    return { valid: false, errors };
  }

  if (!config.fieldId) {
    errors.push('No field selected');
  }

  if (!config.plannedRoute.length) {
    errors.push('No route available');
  }

  const module = robotStatus.attachedModule;
  if (!module) {
    errors.push('No module attached');
  } else if (module.readinessState !== 'ready') {
    errors.push('Module is not ready');
  } else {
    const expectedType = config.operationType;
    if (module.type !== expectedType) {
      errors.push(`Incorrect module: expected ${expectedType}, got ${module.type}`);
    }
    if (module.consumableLevelPercent !== undefined && module.consumableLevelPercent < 10) {
      errors.push('Insufficient consumable level');
    }
  }

  const safety = validateSafetyChecklist(safetyChecklist);
  errors.push(...safety.errors);

  return { valid: errors.length === 0, errors };
}
