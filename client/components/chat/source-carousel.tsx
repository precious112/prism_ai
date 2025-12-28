import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ResearchSource } from '@/types';
/* eslint-disable @next/next/no-img-element */

interface SourceCarouselProps {
  sources: ResearchSource[];
}

export function SourceCarousel({ sources }: SourceCarouselProps) {
  if (!sources.length) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
          {sources.length}
        </span>
        Sources
      </h3>
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex w-max space-x-4 p-1">
          {sources.map((source, index) => {
            let hostname = 'unknown';
            try {
              hostname = new URL(source.url).hostname;
            } catch (e) {
              hostname = source.url;
            }

            return (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="w-[200px] h-[80px] hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden relative group">
                  <CardContent className="p-3 h-full flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2 mb-1.5 w-full justify-center">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                        alt="favicon" 
                        className="w-4 h-4 rounded-sm"
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {hostname}
                      </span>
                    </div>
                    <h4 className="text-xs font-medium line-clamp-2 leading-tight whitespace-normal group-hover:text-primary transition-colors text-center w-full">
                      {source.title}
                    </h4>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
