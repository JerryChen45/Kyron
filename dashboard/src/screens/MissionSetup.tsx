import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRobotStore } from '../store/robotStore';
import { getRobotService } from '../services/robot';
import type { OperationType, SprayingParameters, WeedingParameters } from '../models/mission';
import { Button, Card, Stat } from '../components/ui';

export function MissionSetup() {
  const navigate = useNavigate();
  const {
    fields,
    selectedFieldId,
    selectField,
    setMissionConfig,
    missionConfig,
    loadRoute,
    plannedRoute,
    loading,
    robotStatus,
  } = useRobotStore();

  const robotService = getRobotService();

  const [operationType, setOperationType] = useState<OperationType>(
    missionConfig?.operationType ?? 'laser_weeding',
  );

  useEffect(() => {
    if (selectedFieldId && operationType) {
      const moduleId =
        operationType === 'laser_weeding' ? 'module-laser-01' : 'module-spray-01';
      const parameters: WeedingParameters | SprayingParameters =
        operationType === 'laser_weeding'
          ? {
              weedDensityLevel: 'medium',
              estimatedWeedCount: 340,
              treatmentSensitivity: 'balanced',
              cropExclusionDistanceMeters: 0.15,
              targetAreaSquareMeters: 19200,
              estimatedDurationMinutes: 45,
            }
          : {
              productName: 'Kyron BioShield 42',
              applicationRateLitersPerHectare: 120,
              tankLevelLiters: 180,
              requiredVolumeLiters: 54,
              targetRows: 'Rows 1–12',
              estimatedDurationMinutes: 38,
            };

      setMissionConfig({ fieldId: selectedFieldId, operationType, moduleId, parameters });
      robotService.setAttachedModule?.(moduleId);
      loadRoute();
    }
  }, [selectedFieldId, operationType, setMissionConfig, loadRoute]);

  const selectedField = fields.find((f) => f.fieldId === selectedFieldId);

  const handleContinue = () => {
    if (plannedRoute) navigate('/safety-review');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mission Setup</h2>
        <p className="text-gray-500 text-sm mt-1">Select field, operation, and review parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Field Selection">
          <div className="space-y-3">
            {fields.map((field) => (
              <label
                key={field.fieldId}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedFieldId === field.fieldId
                    ? 'border-[#2d6a4f] bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="field"
                  checked={selectedFieldId === field.fieldId}
                  onChange={() => selectField(field.fieldId)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{field.name}</p>
                  <p className="text-sm text-gray-500">
                    {field.areaHectares} ha · {field.cropType}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Operation Type">
          <div className="space-y-3">
            {(
              [
                { id: 'laser_weeding' as const, label: 'Laser Weeding', desc: 'Precision weed elimination' },
                { id: 'precision_spraying' as const, label: 'Precision Spraying', desc: 'Targeted crop treatment' },
              ] as const
            ).map((op) => (
              <label
                key={op.id}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  operationType === op.id
                    ? 'border-[#2d6a4f] bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="operation"
                  checked={operationType === op.id}
                  onChange={() => setOperationType(op.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">{op.label}</p>
                  <p className="text-sm text-gray-500">{op.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {missionConfig?.parameters && (
        <Card title="Operation Parameters">
          {operationType === 'laser_weeding' ? (
            <WeedingParams params={missionConfig.parameters as WeedingParameters} />
          ) : (
            <SprayingParams params={missionConfig.parameters as SprayingParameters} />
          )}
        </Card>
      )}

      {plannedRoute && selectedField && (
        <Card title="Route Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Stat label="Distance" value={plannedRoute.estimatedDistanceMeters} unit="m" />
            <Stat label="Duration" value={plannedRoute.estimatedDurationMinutes} unit="min" />
            <Stat label="Waypoints" value={plannedRoute.points.length} />
            <Stat label="Est. battery" value={missionConfig?.estimatedBatteryUsagePercent ?? 25} unit="%" />
          </div>
          <p className="text-sm text-gray-500">
            Module: {robotStatus?.attachedModule?.name ?? '—'} · Mode: Autonomous
          </p>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedFieldId || !plannedRoute || loading}
          loading={loading}
        >
          Continue to Safety Review
        </Button>
      </div>
    </div>
  );
}

function WeedingParams({ params }: { params: WeedingParameters }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Stat label="Weed density" value={params.weedDensityLevel} />
      <Stat label="Est. weed count" value={params.estimatedWeedCount} />
      <Stat label="Sensitivity" value={params.treatmentSensitivity} />
      <Stat label="Crop exclusion" value={params.cropExclusionDistanceMeters} unit="m" />
      <Stat label="Target area" value={(params.targetAreaSquareMeters / 10000).toFixed(1)} unit="ha" />
      <Stat label="Est. duration" value={params.estimatedDurationMinutes} unit="min" />
    </div>
  );
}

function SprayingParams({ params }: { params: SprayingParameters }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Stat label="Product" value={params.productName} />
      <Stat label="Application rate" value={params.applicationRateLitersPerHectare} unit="L/ha" />
      <Stat label="Tank level" value={params.tankLevelLiters} unit="L" />
      <Stat label="Required volume" value={params.requiredVolumeLiters} unit="L" />
      <Stat label="Target rows" value={params.targetRows} />
      <Stat label="Est. duration" value={params.estimatedDurationMinutes} unit="min" />
    </div>
  );
}
