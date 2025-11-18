import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
}

export function Logo({ className, height = 40, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <img 
        src="/assets/logo.png" 
        alt="Dubai Tango Festival Logo" 
        height={height}
        className="h-auto object-contain"
        style={{ maxHeight: `${height}px` }}
        onError={(e) => {
          // Fallback to a placeholder if image doesn't exist yet
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
      <div 
        className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm"
        style={{ display: 'none' }}
      >
        DT
      </div>
      {showText && (
        <span className={cn("text-xl font-bold", className?.includes("text-white") ? "text-white" : "text-gray-900")}>Dubai Tango Festival</span>
      )}
    </div>
  );
}

