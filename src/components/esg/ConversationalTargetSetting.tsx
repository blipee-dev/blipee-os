import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, CheckCircle, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AIService } from '@/lib/ai/service';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  targetData?: any;
}

interface Props {
  organizationId: string;
  onTargetCreated?: (target: any) => void;
}

export function ConversationalTargetSetting({ organizationId, onTargetCreated }: Props) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const aiService = new AIService();

  useEffect(() => {
    // Initialize with a welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you set up sustainability targets for your organization. I can help you create science-based targets, track progress, and ensure alignment with frameworks like SBTi. What would you like to achieve?",
      timestamp: new Date(),
      suggestions: [
        "I want to set a net zero target",
        "Help me create a renewable energy target",
        "Set up a waste reduction target",
        "Create a water conservation target"
      ]
    }]);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

  const handleSend = async (message?: string) => {
    const userMessage = message || input;
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Get AI response with ESG context
      const aiResponse = await aiService.processTargetSettingQuery(userMessage, organizationId);
      
      // Add AI response
      const aiMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
        targetData: aiResponse.targetData
      };

      setMessages(prev => [...prev, aiMsg]);

      // If AI provided target data, set it as current target
      if (aiResponse.targetData) {
        setCurrentTarget(aiResponse.targetData);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async () => {
    if (!currentTarget) return;

    try {
      const { data, error } = await supabase
        .from('sustainability_targets')
        .insert([{
          ...currentTarget,
          organization_id: organizationId,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Target Created Successfully!",
        description: `${currentTarget.name} has been added to your sustainability targets.`,
      });

      onTargetCreated?.(data);
      setCurrentTarget(null);

      // Add confirmation message
      const confirmMsg: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Perfect! I've created your "${currentTarget.name}" target. It's now being tracked in your sustainability dashboard. Would you like to set up another target or need help with anything else?`,
        timestamp: new Date(),
        suggestions: [
          "Set up another target",
          "Show me my progress",
          "Help with target tracking",
          "That's all for now"
        ]
      };

      setMessages(prev => [...prev, confirmMsg]);

    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: "Error",
        description: "Failed to create target. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? (
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <MessageSquare className="h-4 w-4 text-blue-600" />
      </div>
    ) : (
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <Target className="h-4 w-4 text-green-600" />
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Conversational Target Setting
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && getMessageIcon(message.role)}
              <div className={`max-w-xs lg:max-w-md ${
                message.role === 'user' ? 'order-1' : 'order-2'
              }`}>
                <div className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border shadow-sm'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Target Data Preview */}
                  {message.targetData && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Target Preview
                        </span>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <p><strong>Name:</strong> {message.targetData.name}</p>
                        <p><strong>Type:</strong> {message.targetData.target_type}</p>
                        <p><strong>Baseline:</strong> {message.targetData.baseline_value} {message.targetData.baseline_unit} ({message.targetData.baseline_year})</p>
                        <p><strong>Target:</strong> {message.targetData.target_value} {message.targetData.target_unit} ({message.targetData.target_year})</p>
                        {message.targetData.is_science_based && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            Science-Based Target
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && getMessageIcon(message.role)}
            </div>
          ))}
          
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-green-600 animate-pulse" />
              </div>
              <div className="bg-white border shadow-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Target Action */}
        {currentTarget && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Ready to create: {currentTarget.name}
                </span>
              </div>
              <Button onClick={handleCreateTarget} size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Target
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your sustainability target..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}