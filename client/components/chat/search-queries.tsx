import { Search } from 'lucide-react';

interface SearchQueriesProps {
  queries: string[];
}

export function SearchQueries({ queries }: SearchQueriesProps) {
  if (!queries.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 max-h-[150px] overflow-y-auto scrollbar-thin">
      {queries.map((query, index) => (
        <div 
          key={index} 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-xs text-secondary-foreground border border-border"
        >
          <Search className="w-3 h-3" />
          <span className="truncate max-w-[200px]">{query}</span>
        </div>
      ))}
    </div>
  );
}
