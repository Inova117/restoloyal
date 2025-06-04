// ============================================================================
// STATUS BADGE COMPONENT
// Restaurant Loyalty Platform - Reusable Status Display Component
// ============================================================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'trial' 
  | 'suspended' 
  | 'pending' 
  | 'healthy' 
  | 'warning' 
  | 'critical'
  | 'business'
  | 'enterprise'
  | 'premium';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  className?: string;
}

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

const statusConfig: Record<StatusType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClasses: {
    default: string;
    outline: string;
    subtle: string;
  };
}> = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    colorClasses: {
      default: 'bg-green-100 text-green-800 border-green-200',
      outline: 'border-green-500 text-green-700 bg-transparent',
      subtle: 'bg-green-50 text-green-700 border-green-100'
    }
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    colorClasses: {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      outline: 'border-gray-500 text-gray-700 bg-transparent',
      subtle: 'bg-gray-50 text-gray-700 border-gray-100'
    }
  },
  trial: {
    label: 'Trial',
    icon: Clock,
    colorClasses: {
      default: 'bg-blue-100 text-blue-800 border-blue-200',
      outline: 'border-blue-500 text-blue-700 bg-transparent',
      subtle: 'bg-blue-50 text-blue-700 border-blue-100'
    }
  },
  suspended: {
    label: 'Suspended',
    icon: XCircle,
    colorClasses: {
      default: 'bg-red-100 text-red-800 border-red-200',
      outline: 'border-red-500 text-red-700 bg-transparent',
      subtle: 'bg-red-50 text-red-700 border-red-100'
    }
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    colorClasses: {
      default: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      outline: 'border-yellow-500 text-yellow-700 bg-transparent',
      subtle: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    }
  },
  healthy: {
    label: 'Healthy',
    icon: CheckCircle,
    colorClasses: {
      default: 'bg-green-100 text-green-800 border-green-200',
      outline: 'border-green-500 text-green-700 bg-transparent',
      subtle: 'bg-green-50 text-green-700 border-green-100'
    }
  },
  warning: {
    label: 'Warning',
    icon: AlertCircle,
    colorClasses: {
      default: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      outline: 'border-yellow-500 text-yellow-700 bg-transparent',
      subtle: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    }
  },
  critical: {
    label: 'Critical',
    icon: XCircle,
    colorClasses: {
      default: 'bg-red-100 text-red-800 border-red-200',
      outline: 'border-red-500 text-red-700 bg-transparent',
      subtle: 'bg-red-50 text-red-700 border-red-100'
    }
  },
  business: {
    label: 'Business',
    icon: Zap,
    colorClasses: {
      default: 'bg-purple-100 text-purple-800 border-purple-200',
      outline: 'border-purple-500 text-purple-700 bg-transparent',
      subtle: 'bg-purple-50 text-purple-700 border-purple-100'
    }
  },
  enterprise: {
    label: 'Enterprise',
    icon: Crown,
    colorClasses: {
      default: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      outline: 'border-indigo-500 text-indigo-700 bg-transparent',
      subtle: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    }
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    colorClasses: {
      default: 'bg-amber-100 text-amber-800 border-amber-200',
      outline: 'border-amber-500 text-amber-700 bg-transparent',
      subtle: 'bg-amber-50 text-amber-700 border-amber-100'
    }
  }
};

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  size = 'md',
  variant = 'default',
  className
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;
  const Icon = config.icon;

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5 gap-1';
      case 'lg':
        return 'text-sm px-3 py-1 gap-2';
      default:
        return 'text-xs px-2.5 py-0.5 gap-1.5';
    }
  };

  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-4 w-4';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center font-medium border transition-colors',
        getSizeClasses(),
        config.colorClasses[variant],
        className
      )}
    >
      {showIcon && <Icon className={getIconSize()} />}
      <span>{displayLabel}</span>
    </Badge>
  );
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export const SubscriptionBadge: React.FC<{
  plan: 'trial' | 'business' | 'enterprise';
  className?: string;
}> = ({ plan, className }) => {
  return <StatusBadge status={plan} className={className} />;
};

export const HealthBadge: React.FC<{
  status: 'healthy' | 'warning' | 'critical';
  className?: string;
}> = ({ status, className }) => {
  return <StatusBadge status={status} className={className} />;
};

export const ActivityBadge: React.FC<{
  status: 'active' | 'inactive' | 'suspended';
  className?: string;
}> = ({ status, className }) => {
  return <StatusBadge status={status} className={className} />;
};

export default StatusBadge; 