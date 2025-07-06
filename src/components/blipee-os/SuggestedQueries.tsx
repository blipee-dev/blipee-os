import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

interface SuggestedQueriesProps {
  queries: string[]
  onSelect: (query: string) => void
}

export function SuggestedQueries({ queries, onSelect }: SuggestedQueriesProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Header with gradient text */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400/60" />
        <p className="text-sm font-light bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Suggested queries
        </p>
      </div>
      
      {/* Query cards with staggered animation */}
      <div className="flex flex-wrap gap-3">
        {queries.map((query, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1,
              ease: 'easeOut'
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(query)}
            className="group relative"
          >
            {/* Glass morphism card */}
            <div className="
              relative px-4 py-2.5 rounded-xl
              backdrop-blur-xl bg-white/[0.02] 
              border border-white/[0.05]
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]
              transition-all duration-300 ease-out
              group-hover:shadow-[0_8px_40px_rgba(139,92,246,0.15)]
              group-hover:border-purple-500/20
              group-hover:bg-white/[0.04]
              overflow-hidden
            ">
              {/* Gradient overlay on hover */}
              <div className="
                absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0
                group-hover:from-purple-500/10 group-hover:to-blue-500/10
                transition-all duration-500 ease-out
              " />
              
              {/* Shimmer effect */}
              <div className="
                absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/5 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-1000 ease-out
              " />
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-sm text-white/80 group-hover:text-white/95 transition-colors duration-300">
                  {query}
                </span>
                <ArrowRight className="
                  w-3 h-3 text-white/40 
                  opacity-0 -translate-x-2
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-300
                " />
              </div>
            </div>
            
            {/* Glow effect on hover */}
            <div className="
              absolute -inset-[1px] rounded-xl
              bg-gradient-to-r from-purple-500/20 to-blue-500/20
              opacity-0 blur-sm
              group-hover:opacity-100
              transition-opacity duration-300
              -z-10
            " />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}