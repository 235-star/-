import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, School, FileText, Eye } from "lucide-react";

interface SiteStats {
  totalReviews: number;
  totalUniversities: number;
  totalProfessors: number;
  totalVisits: number;
}

export default function AdminPage() {
  const { data: stats, isLoading, error } = useQuery<SiteStats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">統計データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">統計データの取得に失敗しました</div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "総レビュー数",
      value: stats?.totalReviews || 0,
      icon: FileText,
      description: "投稿されたレビューの総数",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "大学数",
      value: stats?.totalUniversities || 0,
      icon: School,
      description: "登録されている大学の数",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "教授数",
      value: stats?.totalProfessors || 0,
      icon: Users,
      description: "登録されている教授の数",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "サイト訪問数",
      value: stats?.totalVisits || 0,
      icon: Eye,
      description: "累計サイト訪問回数",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">管理画面</h1>
        </div>
        <p className="text-gray-600">サイトの統計情報を確認できます</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
                <CardDescription className="mt-1">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>統計データについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">レビュー数</Badge>
              <span className="text-sm text-gray-600">学生が投稿したレビューの総数</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">大学数</Badge>
              <span className="text-sm text-gray-600">システムに登録されている大学の数</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">教授数</Badge>
              <span className="text-sm text-gray-600">レビュー対象となっている教授の数</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">訪問数</Badge>
              <span className="text-sm text-gray-600">ホームページの累計アクセス数</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}