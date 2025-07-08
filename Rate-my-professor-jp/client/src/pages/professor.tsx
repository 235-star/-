import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StarRating from "@/components/star-rating";
import ReviewCard from "@/components/review-card";
import ReviewForm from "@/components/review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Professor, Review } from "@shared/schema";

export default function ProfessorPage() {
  const { id } = useParams();
  const professorId = parseInt(id || "0");

  const { data: professor, isLoading: professorLoading } = useQuery<Professor & { universityName: string }>({
    queryKey: [`/api/professors/${professorId}`],
    enabled: !!professorId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/professors/${professorId}/reviews`],
    enabled: !!professorId,
  });

  if (professorLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-6" />
                  <Skeleton className="h-6 w-1/4 mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">教授が見つかりません</h2>
              <p className="text-gray-600">指定された教授は存在しないか、削除された可能性があります。</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professor Info */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-3xl">
                    👨‍🏫
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{professor.name}</h1>
                    <p className="text-lg text-gray-600 mb-1">{professor.department}</p>
                    <p className="text-gray-600 mb-4">{professor.universityName}</p>
                    
                    <div className="flex items-center mb-6">
                      <StarRating rating={professor.overallRating || 0} size="lg" />
                      <span className="text-gray-500 ml-3">({professor.reviewCount} レビュー)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {professor.teachingQuality?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">教え方の質</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {professor.difficulty?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">楽単度</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-academic-blue">
                          {professor.reviewCount}
                        </div>
                        <div className="text-sm text-gray-600">レビュー数</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>学生のレビュー</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">まだレビューがありません。</p>
                    <p className="text-gray-600">この教授の最初のレビューを投稿しませんか？</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review Form */}
          <div>
            <ReviewForm 
              professorId={professor.id} 
              onSuccess={() => {
                // Invalidate queries to refresh data
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
