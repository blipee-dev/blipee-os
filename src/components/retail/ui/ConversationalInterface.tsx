'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationalInterfaceProps {
  selectedStore: string;
}

export function ConversationalInterface({ selectedStore }: ConversationalInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your Retail Intelligence AI assistant. I can help you analyze your store performance, understand customer patterns, and provide actionable insights. What would you like to know about your store today?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // For now, we'll generate contextual responses based on keywords
    // Later, this will integrate with the actual AI service
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      try {
        const response = await fetch(`/api/retail/v1/analytics?loja=${selectedStore}&start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`);
        const data = await response.json();
        
        if (data.success) {
          const sales = data.data.vendas;
          const performanceMsg = sales.total_com_iva > 80000 
            ? '🎉 Excellent performance! Sales are above average.' 
            : sales.total_com_iva < 40000 
            ? '⚠️ Sales are below target. Consider promotional activities.' 
            : '✅ Sales are performing within normal range.';
          
          return `Based on today's data for your store:\\n\\n💰 **Total Sales**: €${sales.total_com_iva.toLocaleString()}\\n🛒 **Transactions**: ${sales.transacoes}\\n📊 **Average Transaction**: €${sales.ticket_medio}\\n\\n${performanceMsg}`;
        }
      } catch (error) {
        return "I'm having trouble accessing your sales data right now. Please try again in a moment.";
      }
    }
    
    if (lowerMessage.includes('traffic') || lowerMessage.includes('visitors') || lowerMessage.includes('people')) {
      try {
        const response = await fetch(`/api/retail/v1/traffic/realtime?loja=${selectedStore}`);
        const data = await response.json();
        
        if (data.success) {
          const traffic = data.data;
          const trafficMsg = traffic.current_occupancy > 150 
            ? '🔥 Your store is quite busy! Consider adding staff for better service.' 
            : traffic.current_occupancy < 50 
            ? '🌤️ Traffic is light right now. Good time for staff training or store maintenance.' 
            : '✅ Normal traffic levels.';
          
          return `Here's your current traffic situation:\\n\\n👥 **Current Occupancy**: ${traffic.current_occupancy} people\\n📈 **Trend**: ${traffic.trend}\\n🚪 **Last Hour**: ${traffic.last_hour.entries} entries, ${traffic.last_hour.exits} exits\\n\\n${trafficMsg}`;
        }
      } catch (error) {
        return "I'm having trouble accessing your traffic data right now. Please try again in a moment.";
      }
    }
    
    if (lowerMessage.includes('conversion') || lowerMessage.includes('convert')) {
      try {
        const response = await fetch(`/api/retail/v1/analytics?loja=${selectedStore}&start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`);
        const data = await response.json();
        
        if (data.success) {
          const conversion = data.data.conversao;
          const conversionMsg = conversion.taxa_conversao > 18 
            ? '🎯 Excellent conversion rate! Your customers are highly engaged.' 
            : conversion.taxa_conversao < 10 
            ? '💡 Opportunity to improve. Try enhancing product displays or staff engagement.' 
            : '✅ Conversion rate is within good range.';
          
          return `Your conversion metrics:\\n\\n📊 **Conversion Rate**: ${conversion.taxa_conversao}%\\n⏱️ **Average Dwell Time**: ${conversion.tempo_medio_permanencia} minutes\\n🛍️ **Items per Transaction**: ${conversion.unidades_por_transacao}\\n\\n${conversionMsg}`;
        }
      } catch (error) {
        return "I'm having trouble accessing your conversion data right now. Please try again in a moment.";
      }
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with:\\n\\n📊 **Sales Analysis** - "Show me today's sales"\\n👥 **Traffic Insights** - "How many people are in my store?"\\n🎯 **Conversion Metrics** - "What's my conversion rate?"\\n💡 **AI Recommendations** - "Give me suggestions to improve performance"\\n📈 **Trends** - "How are we trending?"\\n⏰ **Real-time Data** - All data is updated in real-time\\n\\nJust ask me anything about your store performance!`;
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('improve')) {
      return `Based on your store's performance, here are my recommendations:\\n\\n🎯 **Staff Optimization**: Monitor peak hours and adjust staffing accordingly\\n💡 **Product Placement**: Analyze customer flow to optimize high-value product placement\\n📱 **Engagement**: Use quiet periods for customer engagement and personalized service\\n📊 **Data-Driven Decisions**: Regular analysis of conversion rates and dwell times\\n🎉 **Promotions**: Time promotional activities during high-traffic periods\\n\\nWould you like me to dive deeper into any of these areas?`;
    }
    
    // Default response
    return `I understand you're asking about "${userMessage}". I'm here to help with your retail analytics! You can ask me about:\\n\\n• Sales performance and revenue\\n• Customer traffic and occupancy\\n• Conversion rates and metrics\\n• AI-powered recommendations\\n• Real-time store insights\\n\\nWhat specific aspect of your store would you like to explore?`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-white/[0.05]">
        <MessageCircle className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-purple-500/20' 
                : 'bg-blue-500/20'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-purple-400" />
              ) : (
                <Bot className="h-4 w-4 text-blue-400" />
              )}
            </div>
            
            <div className={`flex-1 max-w-[80%] ${
              message.role === 'user' ? 'text-right' : ''
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-500/20 text-white'
                  : 'bg-white/[0.05] text-gray-100'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-400" />
            </div>
            <div className="bg-white/[0.05] rounded-lg p-3">
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.05]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your store performance..."
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}