import type { RobotConnectionState, RobotOperatingState, AlertSeverity } from '../../models/robot';

const connectionColors: Record<RobotConnectionState, string> = {
  online: 'bg-emerald-100 text-emerald-800',
  connecting: 'bg-blue-100 text-blue-800',
  reconnecting: 'bg-amber-100 text-amber-800',
  offline: 'bg-gray-100 text-gray-600',
  communication_error: 'bg-red-100 text-red-800',
};

const operatingColors: Record<RobotOperatingState, string> = {
  offline: 'bg-gray-100 text-gray-600',
  initializing: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  preparing: 'bg-blue-100 text-blue-800',
  operating: 'bg-[#2d6a4f] text-white',
  paused: 'bg-amber-100 text-amber-800',
  operator_required: 'bg-orange-100 text-orange-800',
  returning_to_base: 'bg-purple-100 text-purple-800',
  charging: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
  emergency_stopped: 'bg-red-600 text-white',
};

const severityColors: Record<AlertSeverity, string> = {
  informational: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  critical: 'bg-red-50 border-red-300 text-red-900',
};

export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | RobotConnectionState | RobotOperatingState | AlertSeverity;
}) {
  const color =
    connectionColors[variant as RobotConnectionState] ??
    operatingColors[variant as RobotOperatingState] ??
    severityColors[variant as AlertSeverity] ??
    'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

export function Card({
  title,
  children,
  className = '',
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-0.5">
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const variants = {
    primary: 'bg-[#2d6a4f] hover:bg-[#40916c] text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? 'Processing…' : children}
    </button>
  );
}
