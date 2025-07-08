import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertReviewSchema, type InsertReview } from "@shared/schema";

interface ReviewFormProps {
  professorId?: number;
  onSuccess?: () => void;
}

export default function ReviewForm({ professorId, onSuccess }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertReview>({
    resolver: zodResolver(insertReviewSchema),
    defaultValues: {
      professorId: professorId || 0,
      course: "",
      overallRating: 0,
      teachingQuality: 1,
      difficulty: 1,
      grade: "",
      content: undefined,
      authorName: "匿名学生",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: InsertReview) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "レビューが投稿されました",
        description: "ご投稿ありがとうございます。",
      });
      form.reset();
      setOverallRating(0);
      queryClient.invalidateQueries({ queryKey: ["/api/professors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "レビューの投稿に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReview) => {
    createReviewMutation.mutate({
      ...data,
      overallRating,
    });
  };

  const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? "text-rating-orange" : "text-gray-300 hover:text-rating-orange"
          }`}
        >
          <Star className="h-6 w-6 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 font-inter">レビューを投稿</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem>
                <FormLabel>科目名</FormLabel>
                <FormControl>
                  <Input placeholder="科目名を入力..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>総合評価</FormLabel>
            <StarRatingInput value={overallRating} onChange={setOverallRating} />
            {overallRating === 0 && (
              <p className="text-sm text-red-500 mt-1">評価を選択してください</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teachingQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>教え方の質</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5 - 優秀</SelectItem>
                      <SelectItem value="4">4 - 良い</SelectItem>
                      <SelectItem value="3">3 - 普通</SelectItem>
                      <SelectItem value="2">2 - やや不満</SelectItem>
                      <SelectItem value="1">1 - 不満</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>楽単度</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5 - 非常に楽単</SelectItem>
                      <SelectItem value="4">4 - 楽単</SelectItem>
                      <SelectItem value="3">3 - 普通</SelectItem>
                      <SelectItem value="2">2 - やや厳しい</SelectItem>
                      <SelectItem value="1">1 - 非常に厳しい</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>取得グレード (予想でも可)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C+">C+</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="不明">不明</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>コメント (任意)</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={4} 
                    placeholder="この教授について詳しく教えてください... (任意)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={createReviewMutation.isPending || overallRating === 0}
            className="w-full bg-academic-blue hover:bg-deep-blue"
          >
            {createReviewMutation.isPending ? "投稿中..." : "レビューを投稿"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
