import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Link as LinkIcon } from 'lucide-react';

interface ReportRendererProps {
  content: string;
}

interface Source {
  title: string;
  url: string;
}

interface Section {
  title: string;
  content: string;
  sources: Source[];
}

export function ReportRenderer({ content }: ReportRendererProps) {
  const sections = useMemo(() => parseXML(content), [content]);

  if (!sections.length && content) {
    // Fallback if parsing fails or no sections yet but there is content
    // This might happen if the model outputs raw text before the first section
    return (
      <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90">
         <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {sections.map((section, idx) => (
        <div key={idx} className="group">
          {section.title && (
            <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
              {section.title}
            </h2>
          )}
          
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-4 text-foreground/90 leading-relaxed">
             <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Custom link rendering to open in new tab
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80" />
                  ),
                }}
             >
                {section.content}
             </ReactMarkdown>
          </div>

          {section.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
               {section.sources.map((source, sIdx) => (
                 <a 
                   key={sIdx}
                   href={source.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground no-underline border border-transparent hover:border-border"
                   title={source.title}
                 >
                   <LinkIcon className="w-3 h-3" />
                   <span className="truncate max-w-[200px]">{source.title}</span>
                 </a>
               ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function parseXML(xml: string): Section[] {
  if (!xml) return [];

  const sections: Section[] = [];
  
  // Split by <section to define boundaries
  // We use a lookahead or just simple split. 
  // If we split by '<section', the first element is usually empty or preamble.
  const parts = xml.split('<section');
  
  // If no sections found, but content exists, return one section with all content
  if (parts.length === 1 && xml.trim().length > 0) {
     return [{ title: '', content: xml, sources: [] }];
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Extract title
    // part starts with ' title="Foo">...'
    const titleMatch = part.match(/title="(.*?)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract text
    let content = '';
    const textStart = part.indexOf('<text>');
    if (textStart !== -1) {
      const textEnd = part.indexOf('</text>');
      if (textEnd !== -1) {
        content = part.substring(textStart + 6, textEnd);
      } else {
        // Still streaming text
        // Find if <sources> started
        const sourcesStart = part.indexOf('<sources>');
        if (sourcesStart !== -1) {
           content = part.substring(textStart + 6, sourcesStart);
        } else {
           // No sources yet, take everything until </section> or end
           // Check for </section>
           const sectionEnd = part.indexOf('</section>');
           if (sectionEnd !== -1) {
             content = part.substring(textStart + 6, sectionEnd);
           } else {
             content = part.substring(textStart + 6);
           }
        }
      }
    }
    
    // Extract sources
    const sources: Source[] = [];
    const sourcesStart = part.indexOf('<sources>');
    if (sourcesStart !== -1) {
      const sourcesEnd = part.indexOf('</sources>');
      const sourcesBlock = sourcesEnd !== -1 
         ? part.substring(sourcesStart + 9, sourcesEnd)
         : part.substring(sourcesStart + 9).replace(/<\/section>$/, '');
         
      // Parse <link url="..." title="..." />
      // Since attributes order might vary or whitespace, regex is safest for this simple format
      const linkRegex = /<link\s+url="(.*?)"\s+title="(.*?)"\s*\/>/g;
      
      // Also handle alternate order: title first
      // Actually the agent prompt says: <link url="..." title="..." />
      // But let's be flexible: <link ... />
      
      // Simple loop over matches
      const linkRegexGlobal = /<link\s+url="([^"]*)"\s+title="([^"]*)"\s*\/>/g;
      let match;
      while ((match = linkRegexGlobal.exec(sourcesBlock)) !== null) {
        sources.push({ url: match[1], title: match[2] });
      }
    }
    
    sections.push({ title, content: content.trim(), sources });
  }
  
  return sections;
}
