import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { University } from "@shared/schema";

interface SearchSectionProps {
  onSearch: (query: string, universityId?: string, department?: string) => void;
}

export default function SearchSection({ onSearch }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>();

  const { data: universities } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  const departments = [
    "工学部",
    "経済学部", 
    "法学部",
    "文学部",
    "理学部",
    "医学部",
    "農学部",
    "教育学部",
  ];

  const handleSearch = () => {
    onSearch(searchQuery, selectedUniversity, selectedDepartment);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="bg-gradient-to-br from-academic-blue to-deep-blue text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4 font-inter">教授を検索・評価</h2>
        <p className="text-xl mb-8 opacity-90">日本全国の大学教授の評価とレビューを検索</p>
        
        <div className="bg-white rounded-lg shadow-xl p-6 text-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="教授名を入力..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger>
                <SelectValue placeholder="大学を選択" />
              </SelectTrigger>
              <SelectContent>
                {universities?.map((university) => (
                  <SelectItem key={university.id} value={university.id.toString()}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="学部・学科" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleSearch}
            className="w-full md:w-auto bg-academic-blue hover:bg-deep-blue"
          >
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </div>
      </div>
    </section>
  );
}
