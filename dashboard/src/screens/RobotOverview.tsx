import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRobotStore } from '../store/robotStore';
import { Badge, Button, Card, Stat } from '../components/ui';
import { AlertPanel } from '../components/alerts/AlertPanel';

export function RobotOverview() {
  const {
    robotStatus,
    telemetry,
    loading,
    error,
    initialize,
    clearError,
  } = useRobotStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading && !robotStatus) {
    return <div className="text-center py-20 text-gray-500">Loading robot status…</div>;
  }

  if (!robotStatus) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error ?? 'Unable to load robot status'}</p>
        <Button onClick={() => initialize()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const health = robotStatus.health;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{robotStatus.name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {robotStatus.model} · ID: {robotStatus.robotId} · {robotStatus.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge label={robotStatus.connectionState} variant={robotStatus.connectionState} />
          <Badge label={robotStatus.operatingState} variant={robotStatus.operatingState} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <p className="text-red-800 text-sm">{error}</p>
          <Button variant="ghost" onClick={clearError}>Dismiss</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Robot Health" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Battery" value={robotStatus.batteryPercent} unit="%" />
            <Stat label="Battery temp" value={health.batteryTemperatureCelsius} unit="°C" />
            <Stat label="Compute temp" value={health.computeTemperatureCelsius} unit="°C" />
            <Stat label="Signal" value={health.connectionStrengthPercent} unit="%" />
            <Stat label="Motors" value={health.motorStatus} />
            <Stat label="E-Stop" value={health.emergencyStopActive ? 'ACTIVE' : 'OK'} />
            <Stat
              label="Last update"
              value={new Date(robotStatus.lastUpdatedAt).toLocaleTimeString()}
            />
            {telemetry && (
              <Stat label="Speed" value={telemetry.speedMetersPerSecond.toFixed(1)} unit="m/s" />
            )}
          </div>
        </Card>

        <Card title="Attached Module">
          {robotStatus.attachedModule ? (
            <div className="space-y-3">
              <p className="font-medium">{robotStatus.attachedModule.name}</p>
              <p className="text-sm text-gray-500">ID: {robotStatus.attachedModule.moduleId}</p>
              <div className="flex gap-2">
                <Badge label={robotStatus.attachedModule.connectionStatus} />
                <Badge label={robotStatus.attachedModule.readinessState} />
              </div>
              {robotStatus.attachedModule.consumableLevelPercent !== undefined && (
                <Stat
                  label="Consumable"
                  value={robotStatus.attachedModule.consumableLevelPercent}
                  unit="%"
                />
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No module attached</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel />
        <Card title="Quick Actions">
          <p className="text-sm text-gray-600 mb-4">
            Configure and start a new mission when the robot is online and ready.
          </p>
          <Link to="/mission-setup">
            <Button disabled={robotStatus.operatingState === 'operating'}>
              Configure Mission
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
