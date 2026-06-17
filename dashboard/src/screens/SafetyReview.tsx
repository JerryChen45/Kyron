import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRobotStore } from '../store/robotStore';
import { validateMissionStart } from '../validation/missionValidation';
import { RouteMap } from '../components/map/RouteMap';
import { Button, Card } from '../components/ui';

export function SafetyReview() {
  const navigate = useNavigate();
  const {
    fields,
    missionConfig,
    plannedRoute,
    safetyChecklist,
    toggleSafetyCheck,
    robotStatus,
    createMission,
    startMission,
    loading,
    pendingCommand,
    error,
    clearError,
  } = useRobotStore();

  const [starting, setStarting] = useState(false);
  const field = fields.find((f) => f.fieldId === missionConfig?.fieldId);
  const validation = validateMissionStart(
    robotStatus,
    missionConfig as Parameters<typeof validateMissionStart>[1],
    safetyChecklist,
  );

  const handleStart = async () => {
    if (!validation.valid) return;
    setStarting(true);
    clearError();
    await createMission();
    const result = await startMission();
    setStarting(false);
    if (result?.status === 'accepted') {
      navigate('/monitoring');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Route & Safety Review</h2>
        <p className="text-gray-500 text-sm mt-1">
          Review the planned route and complete the safety checklist before starting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Planned Route">
          {field && plannedRoute ? (
            <>
              <RouteMap
                boundary={field.boundary}
                route={plannedRoute.points}
                restrictedZones={field.restrictedZones}
                height="350px"
              />
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <span>Distance: {plannedRoute.estimatedDistanceMeters} m</span>
                <span>Duration: ~{plannedRoute.estimatedDurationMinutes} min</span>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No route loaded</p>
          )}
        </Card>

        <Card title="Safety Checklist">
          <div className="space-y-3">
            {safetyChecklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleSafetyCheck(item.id)}
                  className="mt-0.5"
                />
                <span className={`text-sm ${item.checked ? 'text-gray-600' : 'text-gray-900'}`}>
                  {item.label}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {!validation.valid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-900 text-sm mb-2">Start conditions not met:</p>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            {validation.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {pendingCommand && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          Command status: <strong>{pendingCommand.status}</strong>
          {pendingCommand.status === 'pending' && ' — awaiting acknowledgement…'}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/mission-setup')}>
          Back
        </Button>
        <Button
          onClick={handleStart}
          disabled={!validation.valid || starting || loading}
          loading={starting || loading}
        >
          Start Mission
        </Button>
      </div>
    </div>
  );
}
