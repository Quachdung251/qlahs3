// Mục lục Bộ luật Hình sự Việt Nam (cập nhật từ file BLHS.txt)
export interface CriminalCodeItem {
  article: string;
  clause?: string;
  title: string;
  description: string;
}

export const criminalCodeData: CriminalCodeItem[] = [
  { article: "1", title: "Nhiệm vụ của Bộ luật hình sự", description: "" },
  { article: "2", title: "Cơ sở của trách nhiệm hình sự", description: "" },
  { article: "3", title: "Nguyên tắc xử lý", description: "" },
  { article: "4", title: "Trách nhiệm phòng ngừa và đấu tranh chống tội phạm", description: "" },
];

export const searchCriminalCode = (query: string): CriminalCodeItem[] => {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  return criminalCodeData.filter(item => 
    item.article.includes(searchTerm) ||
    item.title.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm)
  );
};

export const formatCriminalCodeDisplay = (item: CriminalCodeItem): string => {
  return `Điều ${item.article} - ${item.title}`;
};