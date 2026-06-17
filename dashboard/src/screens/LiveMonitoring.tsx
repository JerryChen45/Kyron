import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRobotStore } from '../store/robotStore';
import { RouteMap, CameraPanel } from '../components/map/RouteMap';
import { AlertPanel } from '../components/alerts/AlertPanel';
import { Badge, Button, Card, Stat } from '../components/ui';

export function LiveMonitoring() {
  const navigate = useNavigate();
  const {
    currentMission,
    telemetry,
    robotStatus,
    fields,
    missionConfig,
    plannedRoute,
    telemetryHealth,
    pauseMission,
    resumeMission,
    stopMission,
    returnToBase,
    requestOperator,
    pendingCommand,
    loadMissionResult,
  } = useRobotStore();

  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const field = fields.find((f) => f.fieldId === missionConfig?.fieldId);
  const progress = currentMission?.progressPercent ?? 0;
  const isComplete =
    currentMission?.status === 'completed' ||
    robotStatus?.operatingState === 'completed' ||
    progress >= 100;

  useEffect(() => {
    if (isComplete) {
      loadMissionResult().then(() => navigate('/review'));
    }
  }, [isComplete, loadMissionResult, navigate]);

  if (!currentMission) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No active mission</p>
        <Button onClick={() => navigate('/')}>Return to Overview</Button>
      </div>
    );
  }

  const handleConfirmed = async (action: string) => {
    setConfirmAction(null);
    if (action === 'stop') await stopMission();
    if (action === 'return') await returnToBase();
  };

  const completedRoute = plannedRoute?.points.slice(
    0,
    Math.ceil((plannedRoute.points.length * progress) / 100),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Mission Monitoring</h2>
          <p className="text-gray-500 text-sm mt-1">
            Mission {currentMission.missionId.slice(0, 8)} · {field?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={currentMission.status} />
          {telemetryHealth !== 'live' && (
            <Badge label={telemetryHealth === 'delayed' ? 'data delayed' : 'telemetry unavailable'} />
          )}
        </div>
      </div>

      <Card>
        <div className="mb-3 flex justify-between text-sm">
          <span>Progress: {progress.toFixed(0)}%</span>
          <span>
            ETA:{' '}
            {currentMission.estimatedTimeRemainingSeconds
              ? `${Math.ceil(currentMission.estimatedTimeRemainingSeconds / 60)} min`
              : '—'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-[#2d6a4f] h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {field && plannedRoute && (
            <Card title="Route Progress">
              <RouteMap
                boundary={field.boundary}
                route={plannedRoute.points}
                completedRoute={completedRoute}
                restrictedZones={field.restrictedZones}
                robotPosition={telemetry?.position}
                height="380px"
              />
            </Card>
          )}

          <Card title="Telemetry">
            {telemetry ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Battery" value={telemetry.batteryPercent} unit="%" />
                <Stat label="Speed" value={telemetry.speedMetersPerSecond.toFixed(2)} unit="m/s" />
                <Stat label="Connection" value={telemetry.connectionQualityPercent} unit="%" />
                <Stat label="Runtime" value={Math.floor(telemetry.runtimeSeconds / 60)} unit="min" />
                <Stat label="Distance" value={telemetry.distanceTraveledMeters.toFixed(0)} unit="m" />
                <Stat label="Area done" value={(telemetry.areaCompletedSquareMeters / 10000).toFixed(2)} unit="ha" />
                <Stat label="Heading" value={telemetry.position.headingDegrees.toFixed(0)} unit="°" />
                <Stat label="Detected" value={telemetry.moduleTelemetry.targetsDetected} />
                <Stat label="Treated" value={telemetry.moduleTelemetry.targetsTreated} />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Waiting for telemetry…</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Camera">
            <CameraPanel source={{ type: 'placeholder' }} />
          </Card>

          <AlertPanel compact />

          <Card title="Mission Controls">
            <div className="grid grid-cols-2 gap-2">
              {currentMission.status === 'running' ? (
                <Button onClick={() => pauseMission()} disabled={!!pendingCommand}>
                  Pause
                </Button>
              ) : (
                <Button onClick={() => resumeMission()} disabled={!!pendingCommand}>
                  Resume
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => setConfirmAction('stop')}
                disabled={!!pendingCommand}
              >
                Stop
              </Button>
              <Button variant="secondary" onClick={() => setConfirmAction('return')}>
                Return to Base
              </Button>
              <Button variant="secondary" onClick={() => requestOperator()}>
                Request Operator
              </Button>
            </div>
            {pendingCommand && (
              <p className="text-xs text-gray-500 mt-2">
                Command pending: {pendingCommand.status}
              </p>
            )}
          </Card>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-2">Confirm action</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to {confirmAction === 'stop' ? 'stop the mission' : 'return the robot to base'}?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleConfirmed(confirmAction)}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
