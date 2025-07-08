import { Star } from "lucide-react";
import { calculateStarRating } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export default function StarRating({ 
  rating, 
  size = "md", 
  showNumber = true, 
  className = "" 
}: StarRatingProps) {
  const { full, half, empty } = calculateStarRating(rating);
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };
  
  const starClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex text-rating-orange">
        {/* Full stars */}
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starClass} fill-current`} />
        ))}
        
        {/* Half star */}
        {half && (
          <div className="relative">
            <Star className={`${starClass} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${starClass} fill-current text-rating-orange`} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${starClass} text-gray-300`} />
        ))}
      </div>
      
      {showNumber && (
        <span className="ml-2 text-gray-700 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
