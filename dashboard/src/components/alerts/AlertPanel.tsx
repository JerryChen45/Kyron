import { Badge, Button, Card } from '../ui';
import type { RobotAlert } from '../../models/robot';
import { useRobotStore } from '../../store/robotStore';

export function AlertPanel({ compact = false }: { compact?: boolean }) {
  const alerts = useRobotStore((s) => s.alerts);
  const acknowledgeAlert = useRobotStore((s) => s.acknowledgeAlert);

  if (alerts.length === 0) {
    return compact ? null : (
      <Card title="Alerts">
        <p className="text-sm text-gray-500">No active alerts</p>
      </Card>
    );
  }

  const content = (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {alerts.slice(0, compact ? 3 : 20).map((alert) => (
        <AlertItem key={alert.alertId} alert={alert} onAcknowledge={acknowledgeAlert} />
      ))}
    </div>
  );

  if (compact) return content;
  return <Card title="Alerts">{content}</Card>;
}

function AlertItem({
  alert,
  onAcknowledge,
}: {
  alert: RobotAlert;
  onAcknowledge: (id: string) => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        alert.severity === 'critical'
          ? 'bg-red-50 border-red-200'
          : alert.severity === 'warning'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
      } ${alert.acknowledged ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge label={alert.severity} variant={alert.severity} />
            <span className="text-xs text-gray-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="text-xs text-gray-600 mt-1">{alert.recommendedAction}</p>
        </div>
        {!alert.acknowledged && (
          <Button variant="ghost" onClick={() => onAcknowledge(alert.alertId)} className="text-xs shrink-0">
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
}
