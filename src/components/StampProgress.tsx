
import { cn } from '@/lib/utils';

interface StampProgressProps {
  current: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
}

const StampProgress = ({ current, total, size = 'md' }: StampProgressProps) => {
  const percentage = Math.min((current / total) * 100, 100);
  const isComplete = current >= total;
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            isComplete 
              ? "bg-gradient-to-r from-green-500 to-green-600" 
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Stamp indicators */}
      <div className="flex justify-between">
        {Array.from({ length: total }, (_, index) => {
          const stampNumber = index + 1;
          const isEarned = stampNumber <= current;
          
          return (
            <div
              key={index}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200",
                isEarned
                  ? isComplete && stampNumber === current
                    ? "bg-green-600 border-green-600 text-white animate-pulse"
                    : "bg-blue-600 border-blue-600 text-white"
                  : "bg-gray-100 border-gray-300 text-gray-400"
              )}
            >
              {isEarned ? '✓' : stampNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StampProgress;
