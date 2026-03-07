import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ChecklistStatus = 'pass' | 'fail' | 'conditional' | 'pending';

interface ChecklistStatusIconProps {
  status: ChecklistStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  pass: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Pass',
    description: 'Item passed inspection',
  },
  fail: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Fail',
    description: 'Item failed inspection',
  },
  conditional: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Conditional',
    description: 'Item requires conditional approval',
  },
  pending: {
    icon: AlertCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Pending',
    description: 'Status not yet determined',
  },
};

const sizeConfig = {
  sm: { iconSize: 16, padding: 'p-1' },
  md: { iconSize: 20, padding: 'p-1.5' },
  lg: { iconSize: 24, padding: 'p-2' },
};

export function ChecklistStatusIcon({
  status,
  size = 'md',
  showLabel = false,
  onClick,
  className = '',
}: ChecklistStatusIconProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  const iconElement = (
    <div
      className={`
        inline-flex items-center justify-center rounded-full
        ${sizeConf.padding} ${config.bgColor}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <Icon size={sizeConf.iconSize} className={config.color} />
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            {iconElement}
            {showLabel && <span className="text-sm font-medium">{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold">{config.label}</p>
          <p className="text-xs text-gray-200">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ChecklistStatusSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: ChecklistStatus;
  onChange: (status: ChecklistStatus) => void;
  disabled?: boolean;
}) {
  const statuses: ChecklistStatus[] = ['pending', 'pass', 'conditional', 'fail'];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs font-medium text-muted-foreground">Status:</span>
      <div className="flex gap-1">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onChange(status)}
            disabled={disabled}
            className={`
              transition-all
              ${value === status ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <ChecklistStatusIcon status={status} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}
