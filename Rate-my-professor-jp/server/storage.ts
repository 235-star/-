import { universities, professors, reviews, type University, type Professor, type Review, type InsertUniversity, type InsertProfessor, type InsertReview } from "@shared/schema";

export interface IStorage {
  // Universities
  getUniversities(): Promise<University[]>;
  getUniversity(id: number): Promise<University | undefined>;
  createUniversity(university: InsertUniversity): Promise<University>;
  
  // Professors
  getProfessors(filters?: { universityId?: number; search?: string }): Promise<(Professor & { universityName: string })[]>;
  getProfessor(id: number): Promise<(Professor & { universityName: string }) | undefined>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  updateProfessorRatings(professorId: number): Promise<void>;
  
  // Reviews
  getReviewsByProfessor(professorId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Search
  searchProfessors(query: string, universityId?: number): Promise<(Professor & { universityName: string })[]>;
  
  // Statistics
  getStats(): Promise<{
    totalReviews: number;
    totalUniversities: number;
    totalProfessors: number;
    totalVisits: number;
  }>;
  incrementAccessCount(): Promise<void>;
}

export class MemStorage implements IStorage {
  private universities: Map<number, University>;
  private professors: Map<number, Professor>;
  private reviews: Map<number, Review>;
  private accessCount: number;
  private currentUniversityId: number;
  private currentProfessorId: number;
  private currentReviewId: number;

  constructor() {
    this.universities = new Map();
    this.professors = new Map();
    this.reviews = new Map();
    this.accessCount = 0;
    this.currentUniversityId = 1;
    this.currentProfessorId = 1;
    this.currentReviewId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed universities
    const universityData = [
      { name: "東京大学", nameEn: "University of Tokyo" },
      { name: "京都大学", nameEn: "Kyoto University" },
      { name: "早稲田大学", nameEn: "Waseda University" },
      { name: "慶應義塾大学", nameEn: "Keio University" },
      { name: "大阪大学", nameEn: "Osaka University" },
    ];

    universityData.forEach(data => {
      const university: University = {
        id: this.currentUniversityId++,
        ...data,
        professorCount: 0,
      };
      this.universities.set(university.id, university);
    });

    // Seed professors
    const professorData = [
      { name: "田中 太郎", department: "工学部 情報工学科", universityId: 1 },
      { name: "佐藤 花子", department: "経済学部 国際経済学科", universityId: 2 },
      { name: "山田 一郎", department: "文学部 日本文学科", universityId: 3 },
      { name: "鈴木 次郎", department: "理学部 数学科", universityId: 1 },
      { name: "高橋 美咲", department: "法学部 法律学科", universityId: 4 },
    ];

    professorData.forEach(data => {
      const professor: Professor = {
        id: this.currentProfessorId++,
        ...data,
        overallRating: 0,
        teachingQuality: 0,
        difficulty: 0,
        reviewCount: 0,
      };
      this.professors.set(professor.id, professor);
      
      // Update university professor count
      const university = this.universities.get(data.universityId);
      if (university) {
        university.professorCount++;
      }
    });

    // Seed reviews
    const reviewData = [
      {
        professorId: 1,
        course: "データ構造とアルゴリズム",
        overallRating: 5,
        teachingQuality: 5,
        difficulty: 3,
        grade: "A",
        content: "とても分かりやすい授業でした。複雑なアルゴリズムも丁寧に説明してくれて、理解しやすかったです。課題は少し多めですが、実力がつきます。",
      },
      {
        professorId: 2,
        course: "国際経済論",
        overallRating: 5,
        teachingQuality: 5,
        difficulty: 3,
        grade: "A+",
        content: "授業が非常に興味深く、現実の事例を多く使って説明してくれます。質問にも丁寧に答えてくれて、とても親しみやすい先生です。",
      },
      {
        professorId: 3,
        course: "日本古典文学",
        overallRating: 4,
        teachingQuality: 4,
        difficulty: 4,
        grade: "B+",
        content: "古典文学への愛情が伝わってくる授業です。少し難しい内容もありますが、文学の美しさを教えてくれる素晴らしい先生です。",
      },
    ];

    reviewData.forEach(data => {
      const review: Review = {
        id: this.currentReviewId++,
        ...data,
        authorName: "匿名学生",
        createdAt: new Date(),
      };
      this.reviews.set(review.id, review);
    });

    // Update professor ratings
    this.professors.forEach((_, professorId) => {
      this.updateProfessorRatingsSync(professorId);
    });
  }

  async getUniversities(): Promise<University[]> {
    return Array.from(this.universities.values());
  }

  async getUniversity(id: number): Promise<University | undefined> {
    return this.universities.get(id);
  }

  async createUniversity(university: InsertUniversity): Promise<University> {
    const newUniversity: University = {
      id: this.currentUniversityId++,
      ...university,
      professorCount: 0,
    };
    this.universities.set(newUniversity.id, newUniversity);
    return newUniversity;
  }

  async getProfessors(filters?: { universityId?: number; search?: string }): Promise<(Professor & { universityName: string })[]> {
    let professorList = Array.from(this.professors.values());

    if (filters?.universityId) {
      professorList = professorList.filter(p => p.universityId === filters.universityId);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      professorList = professorList.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.department.toLowerCase().includes(searchLower)
      );
    }

    return professorList.map(professor => ({
      ...professor,
      universityName: this.universities.get(professor.universityId)?.name || "",
    }));
  }

  async getProfessor(id: number): Promise<(Professor & { universityName: string }) | undefined> {
    const professor = this.professors.get(id);
    if (!professor) return undefined;

    return {
      ...professor,
      universityName: this.universities.get(professor.universityId)?.name || "",
    };
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const newProfessor: Professor = {
      id: this.currentProfessorId++,
      ...professor,
      overallRating: 0,
      teachingQuality: 0,
      difficulty: 0,
      reviewCount: 0,
    };
    this.professors.set(newProfessor.id, newProfessor);

    // Update university professor count
    const university = this.universities.get(professor.universityId);
    if (university) {
      university.professorCount++;
    }

    return newProfessor;
  }

  async getReviewsByProfessor(professorId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.professorId === professorId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const newReview: Review = {
      id: this.currentReviewId++,
      ...review,
      authorName: review.authorName || "匿名学生",
      createdAt: new Date(),
    };
    this.reviews.set(newReview.id, newReview);

    // Update professor ratings
    await this.updateProfessorRatings(review.professorId);

    return newReview;
  }

  async updateProfessorRatings(professorId: number): Promise<void> {
    this.updateProfessorRatingsSync(professorId);
  }

  private updateProfessorRatingsSync(professorId: number): void {
    const professor = this.professors.get(professorId);
    if (!professor) return;

    const professorReviews = Array.from(this.reviews.values())
      .filter(review => review.professorId === professorId);

    if (professorReviews.length === 0) {
      professor.overallRating = 0;
      professor.teachingQuality = 0;
      professor.difficulty = 0;
      professor.reviewCount = 0;
      return;
    }

    const totalOverall = professorReviews.reduce((sum, review) => sum + review.overallRating, 0);
    const totalTeaching = professorReviews.reduce((sum, review) => sum + review.teachingQuality, 0);
    const totalDifficulty = professorReviews.reduce((sum, review) => sum + review.difficulty, 0);

    professor.overallRating = Math.round((totalOverall / professorReviews.length) * 10) / 10;
    professor.teachingQuality = Math.round((totalTeaching / professorReviews.length) * 10) / 10;
    professor.difficulty = Math.round((totalDifficulty / professorReviews.length) * 10) / 10;
    professor.reviewCount = professorReviews.length;
  }

  async searchProfessors(query: string, universityId?: number): Promise<(Professor & { universityName: string })[]> {
    return this.getProfessors({ universityId, search: query });
  }

  async getStats(): Promise<{
    totalReviews: number;
    totalUniversities: number;
    totalProfessors: number;
    totalVisits: number;
  }> {
    const uniqueUniversityIds = new Set<number>();
    const uniqueProfessorIds = new Set<number>();

    // Count unique universities and professors from the data
    for (const professor of this.professors.values()) {
      uniqueUniversityIds.add(professor.universityId);
      uniqueProfessorIds.add(professor.id);
    }

    return {
      totalReviews: this.reviews.size,
      totalUniversities: this.universities.size,
      totalProfessors: this.professors.size,
      totalVisits: this.accessCount,
    };
  }

  async incrementAccessCount(): Promise<void> {
    this.accessCount += 1;
  }
}

export const storage = new MemStorage();
