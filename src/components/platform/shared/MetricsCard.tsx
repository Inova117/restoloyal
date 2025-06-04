// ============================================================================
// METRICS CARD COMPONENT
// Restaurant Loyalty Platform - Reusable Metrics Display Component
// ============================================================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    period?: string;
  };
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status = 'neutral',
  loading = false,
  className,
  size = 'md',
  variant = 'default'
}) => {
  // Format the main value
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with K, M, B suffixes
      if (val >= 1000000000) {
        return `${(val / 1000000000).toFixed(1)}B`;
      } else if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val.toString();
  };

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!trend) return null;

    const isPositive = trend.value > 0;
    const isNegative = trend.value < 0;
    const isNeutral = trend.value === 0;

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    
    const trendColorClass = 
      isPositive ? 'text-green-600' :
      isNegative ? 'text-red-600' :
      'text-gray-500';

    const trendBgClass = 
      isPositive ? 'bg-green-50' :
      isNegative ? 'bg-red-50' :
      'bg-gray-50';

    return (
      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', trendBgClass, trendColorClass)}>
        <TrendIcon className="h-3 w-3" />
        <span>
          {isPositive && '+'}
          {Math.abs(trend.value).toFixed(1)}%
        </span>
        {trend.label && <span className="text-gray-600">vs {trend.label}</span>}
      </div>
    );
  };

  // Get status color classes
  const getStatusClasses = () => {
    switch (status) {
      case 'positive':
        return 'border-green-200 bg-green-50/50';
      case 'negative':
        return 'border-red-200 bg-red-50/50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/50';
      default:
        return 'border-gray-200';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className, getStatusClasses())}>
        <CardContent className={getSizeClasses()}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              {Icon && <div className="h-5 w-5 bg-gray-200 rounded"></div>}
            </div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            {description && <div className="h-3 bg-gray-200 rounded w-32"></div>}
            {trend && <div className="h-5 bg-gray-200 rounded w-16"></div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn('transition-all duration-200 hover:shadow-md', className, getStatusClasses())}>
        <CardContent className={cn('flex items-center justify-between', getSizeClasses())}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {Icon && <Icon className="h-4 w-4 text-gray-600" />}
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          </div>
          {trend && (
            <div className="ml-4">
              {getTrendDisplay()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default and detailed variants
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className, getStatusClasses())}>
      <CardHeader className={cn('pb-2', size === 'sm' ? 'p-3 pb-1' : size === 'lg' ? 'p-6 pb-3' : 'p-4 pb-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            'font-medium text-gray-600',
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={cn(
              'text-gray-400',
              size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
            )} />
          )}
        </div>
        {description && variant === 'detailed' && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={cn(
        'pt-0',
        size === 'sm' ? 'px-3 pb-3' : size === 'lg' ? 'px-6 pb-6' : 'px-4 pb-4'
      )}>
        <div className="space-y-2">
          <div className={cn(
            'font-bold text-gray-900',
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
          )}>
            {formatValue(value)}
          </div>
          
          <div className="flex items-center justify-between">
            {trend && getTrendDisplay()}
            
            {description && variant === 'default' && (
              <p className="text-xs text-gray-500 ml-auto">{description}</p>
            )}
          </div>
          
          {variant === 'detailed' && trend?.period && (
            <p className="text-xs text-gray-500">
              Period: {trend.period}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsCard; 