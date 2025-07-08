import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./star-rating";
import { formatDate } from "@/lib/utils";
import type { Review } from "@shared/schema";

interface ReviewCardProps {
  review: Review & {
    professorName?: string;
    professorDepartment?: string;
    universityName?: string;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            {review.professorName && (
              <h4 className="font-semibold">{review.professorName}</h4>
            )}
            <p className="text-sm text-gray-600">{review.course}</p>
            {review.professorDepartment && (
              <p className="text-xs text-gray-500">{review.professorDepartment}</p>
            )}
          </div>
          <StarRating rating={review.overallRating} size="sm" showNumber={false} />
        </div>
        
        {review.content && <p className="text-gray-700 mb-3">{review.content}</p>}
        
        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
          <div>
            <span className="text-gray-600">教え方:</span>
            <span className="font-medium text-green-600 ml-1">{review.teachingQuality}</span>
          </div>
          <div>
            <span className="text-gray-600">楽単度:</span>
            <span className="font-medium text-yellow-600 ml-1">{review.difficulty}</span>
          </div>
          {review.grade && (
            <div>
              <span className="text-gray-600">グレード:</span>
              <span className="font-medium text-blue-600 ml-1">{review.grade}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <span>{review.authorName}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(review.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
