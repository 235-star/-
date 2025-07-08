import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from "./star-rating";
import type { Professor } from "@shared/schema";

interface ProfessorCardProps {
  professor: Professor & { universityName: string };
}

export default function ProfessorCard({ professor }: ProfessorCardProps) {
  return (
    <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-6xl text-gray-400">👨‍🏫</div>
      </div>
      
      <CardContent className="p-6">
        <h4 className="text-xl font-semibold mb-2">{professor.name}</h4>
        <p className="text-gray-600 mb-2">{professor.department}</p>
        <p className="text-gray-600 mb-4">{professor.universityName}</p>
        
        <div className="flex items-center mb-4">
          <StarRating rating={professor.overallRating || 0} />
          <span className="text-gray-500 ml-2">({professor.reviewCount} レビュー)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-600">教え方:</span>
            <span className="font-medium text-green-600 ml-1">
              {professor.teachingQuality?.toFixed(1) || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">楽単度:</span>
            <span className="font-medium text-yellow-600 ml-1">
              {professor.difficulty?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>

        <Link href={`/professor/${professor.id}`}>
          <Button className="w-full bg-academic-blue hover:bg-deep-blue">
            詳細を見る
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
