interface SuggestedQueriesProps {
  queries: string[]
  onSelect: (query: string) => void
}

export function SuggestedQueries({ queries, onSelect }: SuggestedQueriesProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-text-secondary">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {queries.map((query, index) => (
          <button
            key={index}
            onClick={() => onSelect(query)}
            className="px-3 py-2 text-sm bg-surface hover:bg-surface/80 
                     text-text-primary rounded-lg border border-surface 
                     hover:border-primary/50 transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  )
}