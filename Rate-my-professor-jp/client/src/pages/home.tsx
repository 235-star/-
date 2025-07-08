import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { University } from "lucide-react";
import Header from "@/components/header";
import SearchSection from "@/components/search-section";
import ProfessorCard from "@/components/professor-card";
import ReviewCard from "@/components/review-card";
import ReviewForm from "@/components/review-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Professor, University as UniversityType, Review } from "@shared/schema";

export default function Home() {
  const [searchResults, setSearchResults] = useState<(Professor & { universityName: string })[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { data: featuredProfessors, isLoading: professorsLoading } = useQuery<(Professor & { universityName: string })[]>({
    queryKey: ["/api/professors"],
  });

  const { data: universities, isLoading: universitiesLoading } = useQuery<UniversityType[]>({
    queryKey: ["/api/universities"],
  });

  const { data: recentReviews, isLoading: reviewsLoading } = useQuery<(Review & {
    professorName: string;
    professorDepartment: string;
    universityName: string;
  })[]>({
    queryKey: ["/api/reviews/recent"],
  });

  // Track site access
  const trackAccessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/track-access");
    },
  });

  useEffect(() => {
    // Track access when the homepage loads
    trackAccessMutation.mutate();
  }, []); // Empty dependency array means this runs once on mount

  const handleSearch = async (query: string, universityId?: string, department?: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (universityId) searchParams.append('universityId', universityId);

      const response = await fetch(`/api/search?${searchParams}`);
      const results = await response.json();
      
      let filteredResults = results;
      if (department) {
        filteredResults = results.filter((prof: Professor & { universityName: string }) => 
          prof.department.includes(department)
        );
      }
      
      setSearchResults(filteredResults);
      setShowSearch(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setShowSearch(true);
    }
  };

  const topProfessors = featuredProfessors?.slice(0, 3) || [];
  const totalProfessors = featuredProfessors?.length || 0;
  const totalReviews = featuredProfessors?.reduce((sum, prof) => sum + (prof.reviewCount || 0), 0) || 0;
  const totalUniversities = universities?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchSection onSearch={handleSearch} />

      {showSearch && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">検索結果</h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((professor) => (
                  <ProfessorCard key={professor.id} professor={professor} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">該当する教授が見つかりませんでした。</p>
            )}
          </div>
        </section>
      )}

      {/* Featured Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 font-inter mb-4">人気の教授</h3>
            <p className="text-lg text-gray-600">学生から高評価を受けている教授をご紹介</p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-academic-blue mb-2">{totalProfessors.toLocaleString()}</div>
              <div className="text-gray-600">登録教授数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-academic-blue mb-2">{totalReviews.toLocaleString()}</div>
              <div className="text-gray-600">レビュー数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-academic-blue mb-2">{totalUniversities}</div>
              <div className="text-gray-600">参加大学数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-academic-blue mb-2">24,589</div>
              <div className="text-gray-600">利用学生数</div>
            </div>
          </div>

          {/* Featured Professors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professorsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              topProfessors.map((professor) => (
                <ProfessorCard key={professor.id} professor={professor} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* University Section */}
      <section className="py-16 bg-neutral-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 font-inter mb-4">大学別検索</h3>
            <p className="text-lg text-gray-600">主要大学から教授を検索</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {universitiesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 text-center">
                  <Skeleton className="w-full h-20 rounded-lg mb-4" />
                  <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </Card>
              ))
            ) : (
              universities?.slice(0, 5).map((university) => (
                <Card key={university.id} className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-full h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
                    <University className="h-8 w-8 text-academic-blue" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{university.name}</h4>
                  <p className="text-sm text-gray-600">{university.professorCount}名</p>
                </Card>
              ))
            )}
            <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-full h-20 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <University className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">その他の大学</h4>
              <p className="text-sm text-gray-600">もっと見る</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Recent Reviews */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 font-inter">最新のレビュー</h3>
              
              <div className="space-y-6">
                {reviewsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-gray-50">
                      <CardContent className="p-6">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/3 mb-4" />
                        <Skeleton className="h-16 w-full mb-3" />
                        <Skeleton className="h-4 w-1/4" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  recentReviews?.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </div>
            </div>

            {/* Review Submission Form */}
            <ReviewForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4 font-inter">楽単ドットコム</h4>
              <p className="text-gray-400 text-sm">日本の大学教授評価プラットフォーム</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">サービス</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">教授検索</a></li>
                <li><a href="#" className="hover:text-white transition-colors">大学一覧</a></li>
                <li><a href="#" className="hover:text-white transition-colors">レビュー投稿</a></li>
                <li><a href="#" className="hover:text-white transition-colors">人気ランキング</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">サポート</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">ヘルプ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">利用規約</a></li>
                <li><a href="#" className="hover:text-white transition-colors">プライバシー</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">フォロー</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2024 楽単ドットコム. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
