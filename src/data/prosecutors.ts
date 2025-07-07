// Danh sách Kiểm sát viên
export interface Prosecutor {
  id: string;
  name: string;
  title: string;
  department?: string;
}

export const prosecutorsData: Prosecutor[] = [

];

export const searchProsecutors = (query: string): Prosecutor[] => {
  if (!query.trim()) return prosecutorsData;
  
  const searchTerm = query.toLowerCase();
  return prosecutorsData.filter(prosecutor => 
    prosecutor.name.toLowerCase().includes(searchTerm) ||
    prosecutor.title.toLowerCase().includes(searchTerm) ||
    (prosecutor.department && prosecutor.department.toLowerCase().includes(searchTerm))
  );
};