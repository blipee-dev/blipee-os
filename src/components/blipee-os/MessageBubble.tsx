import { Message } from '@/types/conversation'
import { Building2, User } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary/20' : 'bg-secondary/20'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-primary" />
        ) : (
          <Building2 className="w-5 h-5 text-secondary" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-3 rounded-lg ${
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-surface text-text-primary'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}