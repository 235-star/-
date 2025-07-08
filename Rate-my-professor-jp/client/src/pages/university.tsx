import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import ProfessorCard from "@/components/professor-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { University, Professor } from "@shared/schema";

export default function UniversityPage() {
  const { id } = useParams();
  const universityId = parseInt(id || "0");

  const { data: university, isLoading: universityLoading } = useQuery<University>({
    queryKey: [`/api/universities/${universityId}`],
    enabled: !!universityId,
  });

  const { data: professors, isLoading: professorsLoading } = useQuery<(Professor & { universityName: string })[]>({
    queryKey: ["/api/professors", { universityId }],
    enabled: !!universityId,
  });

  if (universityLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">大学が見つかりません</h2>
              <p className="text-gray-600">指定された大学は存在しないか、削除された可能性があります。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* University Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{university.name}</h1>
            {university.nameEn && (
              <p className="text-lg text-gray-600 mb-4">{university.nameEn}</p>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-academic-blue">{university.professorCount}</div>
                <div className="text-sm text-gray-600">登録教授数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {professors?.reduce((sum, prof) => sum + (prof.reviewCount || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600">総レビュー数</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {professors?.length > 0 
                    ? (professors.reduce((sum, prof) => sum + (prof.overallRating || 0), 0) / professors.length).toFixed(1)
                    : "N/A"
                  }
                </div>
                <div className="text-sm text-gray-600">平均評価</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professors List */}
        <Card>
          <CardHeader>
            <CardTitle>所属教授一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {professorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-6 w-1/3 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : professors && professors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professors.map((professor) => (
                  <ProfessorCard key={professor.id} professor={professor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">この大学の教授情報はまだ登録されていません。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
