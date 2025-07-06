import { Message } from '@/types/conversation'
import { Building2, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar with gradient glow */}
      <div className="relative flex-shrink-0">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          backdrop-blur-xl relative overflow-hidden
          before:absolute before:inset-0 before:rounded-full
          ${isUser 
            ? 'before:bg-gradient-to-br before:from-purple-500/20 before:to-pink-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)] light-mode:shadow-[0_0_16px_rgba(103,80,164,0.2)]' 
            : 'before:bg-gradient-to-br before:from-blue-500/20 before:to-cyan-500/20 shadow-[0_0_20px_rgba(14,165,233,0.3)] light-mode:shadow-[0_0_16px_rgba(0,128,255,0.2)]'
          }
        `}>
          <div className="relative z-10 flex items-center justify-center">
            {isUser ? (
              <User className="w-5 h-5 text-white/90 light-mode:text-gray-700" />
            ) : (
              <Building2 className="w-5 h-5 text-white/90 light-mode:text-gray-700" />
            )}
          </div>
        </div>
        {/* Animated ring */}
        <div className={`
          absolute inset-0 rounded-full animate-ping
          ${isUser ? 'bg-purple-500/20' : 'bg-blue-500/20'}
          light-mode:opacity-50
        `} />
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Glass morphism message bubble */}
        <div className={`
          inline-block relative group
          ${isUser ? '' : 'text-left'}
        `}>
          <div className={`
            relative px-4 py-3 rounded-2xl
            backdrop-blur-xl bg-white/[0.02] 
            border border-white/[0.05]
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            transition-all duration-300 ease-out
            hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)]
            hover:border-white/[0.1]
            
            light-mode:bg-white/70
            light-mode:border-gray-200/50
            light-mode:shadow-[0_4px_16px_rgba(0,0,0,0.06)]
            light-mode:hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
            light-mode:hover:border-gray-300/50
            
            ${isUser 
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 light-mode:from-purple-500/5 light-mode:to-pink-500/5' 
              : 'hover:bg-white/[0.04] light-mode:hover:bg-white/80'
            }
          `}>
            {/* Gradient accent for user messages */}
            {isUser && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 light-mode:from-purple-500/10 light-mode:to-pink-500/10" />
            )}
            
            {/* AI sparkle indicator */}
            {!isUser && (
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-blue-400/60 light-mode:text-blue-500/70" />
            )}
            
            <p className={`
              relative z-10 whitespace-pre-wrap
              ${isUser ? 'text-white/95 light-mode:text-gray-800' : 'text-white/90 light-mode:text-gray-700'}
            `}>
              {message.content}
            </p>
          </div>
        </div>
        
        {/* Timestamp with subtle animation */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-white/40 light-mode:text-gray-500 mt-2 font-light"
        >
          {message.timestamp.toLocaleTimeString()}
        </motion.p>
      </div>
    </motion.div>
  )
}