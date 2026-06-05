import { cn } from "@oruclass/utils";

function decodeHTMLEntities(text: string) {
  if (!text) return text;
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => entities[match] || match);
}

interface SafeHTMLProps {
  html?: string | null;
  className?: string;
}

export function SafeHTML({ html, className }: SafeHTMLProps) {
  if (!html) return null;

  const decodedHtml = decodeHTMLEntities(html);

  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: decodedHtml }}
    />
  );
}
