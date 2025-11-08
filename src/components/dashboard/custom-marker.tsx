import { Siren, HandHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomMarkerProps {
  type: 'incident' | 'pledge';
  severity?: 'Low' | 'Medium' | 'High';
}

export default function CustomMarker({ type, severity }: CustomMarkerProps) {
  const isHighSeverity = type === 'incident' && severity === 'High';

  const baseClasses = "h-10 w-10 rounded-full flex items-center justify-center border-4 shadow-lg";
  
  const typeClasses = {
    incident: 'bg-destructive/80 border-destructive text-destructive-foreground',
    pledge: 'bg-primary/80 border-primary text-primary-foreground',
  };

  const animationClass = isHighSeverity ? 'pulse-marker' : '';

  return (
    <div className={cn(baseClasses, typeClasses[type], animationClass)}>
      {type === 'incident' ? (
        <Siren className="h-5 w-5" />
      ) : (
        <HandHeart className="h-5 w-5" />
      )}
    </div>
  );
}
