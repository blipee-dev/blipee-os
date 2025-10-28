'use client';

/**
 * Official AI SDK Chat Interface with Agent Class
 *
 * Built with Vercel AI SDK Elements and Agent class for type safety
 * Following ChatGPT mobile design patterns with full support for:
 * - Message parts (text, reasoning, sources, tools)
 * - File attachments (images, PDFs, audio)
 * - Actions (copy, regenerate)
 * - Type-safe UIMessages (SustainabilityAgentUIMessage)
 * - Multi-provider support (OpenAI, Anthropic)
 * - Dynamic model selection
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { cn } from '@/lib/utils';
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionAddAttachments,
  PromptInputSpeechButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  type PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Loader } from '@/components/ai-elements/loader';
import { Action, Actions } from '@/components/ai-elements/actions';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@/components/ai-elements/reasoning';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger
} from '@/components/ai-elements/sources';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Bot, CopyIcon, RefreshCcwIcon, PaperclipIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { Fragment, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { SustainabilityAgentUIMessage } from '@/lib/ai/agents/sustainability-agent';
import { ToolConfirmation } from '@/components/ai-elements/tool-confirmation';
import { requiresApproval } from '@/lib/ai/hitl/tool-config';
import { isToolUIPart, getToolName } from 'ai';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { MetricsChart, type ChartData } from '@/components/chat/MetricsChart';

// Available AI models for selection
const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet' },
];

/**
 * Generate context-aware suggestions based on current page
 */
function getContextualSuggestions(pathname: string): string[] {
  // Settings pages - focus on configuration and help
  if (pathname.startsWith('/settings')) {
    return [
      'How do I add users to my organization?',
      'Where can I find my API keys?',
      'How do I set up integrations?',
      'Where are my billing settings?',
    ];
  }

  // Profile pages - focus on account and preferences
  if (pathname.startsWith('/profile')) {
    return [
      'How do I change my password?',
      'Where can I update my notification preferences?',
      'How do I change the app theme?',
      'Where are my account security settings?',
    ];
  }

  // Sustainability pages - focus on emissions and data
  if (pathname.startsWith('/sustainability')) {
    return [
      'What are my emissions this year?',
      'Show me my emissions breakdown by scope',
      'How do I track business travel?',
      'I want to add sustainability data',
    ];
  }

  // Default suggestions for other pages
  return [
    'What are my emissions this year?',
    'How do I get started with blipee?',
    'Show me my sustainability dashboard',
    'I want to add sustainability data',
  ];
}

interface ChatInterfaceProps {
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  initialMessages?: SustainabilityAgentUIMessage[];
  className?: string;
  onConversationUpdate?: () => void; // Callback to refresh conversation list
}

export function ChatInterface({
  conversationId,
  organizationId,
  buildingId,
  initialMessages,
  className,
  onConversationUpdate
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState(AVAILABLE_MODELS[0].id);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  // Generate context-aware suggestions based on current page
  const suggestions = useMemo(() => getContextualSuggestions(pathname), [pathname]);

  // Get user initials from name or email
  const getUserInitials = useCallback(() => {
    if (!user) return 'U';

    // Try to get from user name first
    if (user.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      }
      return nameParts[0].slice(0, 2).toUpperCase();
    }

    // Fallback to email
    if (user.email) {
      const emailParts = user.email.split('@')[0].split('.');
      if (emailParts.length >= 2) {
        return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
      }
      return user.email.slice(0, 2).toUpperCase();
    }

    return 'U';
  }, [user]);

  // Memoize the transport configuration to prevent re-renders
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    // Only send the last message to the server (recommended pattern for persistence)
    prepareSendMessagesRequest({ messages, id }) {
      return {
        body: {
          message: messages[messages.length - 1], // Send only the last message
          conversationId,
          organizationId,
          buildingId,
          model
        }
      };
    }
  }), [conversationId, organizationId, buildingId, model]);

  // Memoize the onFinish callback
  const handleFinish = useCallback(() => {
    // Refresh conversation list when message is complete
    if (onConversationUpdate) {
      onConversationUpdate();
    }
  }, [onConversationUpdate]);

  const { messages, setMessages, sendMessage, status, error, regenerate, addToolResult } = useChat<SustainabilityAgentUIMessage>({
    id: conversationId, // CRITICAL: This forces useChat to reinitialize when conversation changes
    initialMessages: initialMessages || [],
    transport,
    onFinish: handleFinish
  });

  // WORKAROUND: Manually set messages when initialMessages changes
  // This is needed because useChat's initialMessages prop doesn't always reinitialize properly
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else {
      setMessages([]);
    }
  }, [conversationId, initialMessages, setMessages]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Body parameters are now handled by prepareSendMessagesRequest
    sendMessage({
      text: message.text || 'Sent with attachments',
      files: message.files
    });
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Body parameters are now handled by prepareSendMessagesRequest
    sendMessage({ text: suggestion });
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }));
    // TODO: Send feedback to API
    console.log(`Feedback for message ${messageId}:`, type);
  };

  return (
    <div className={cn("flex flex-col w-full h-full bg-white dark:bg-gray-950 relative", className)}>
      {/* Messages Container - ChatGPT Mobile Style */}
      <Conversation className="flex-1 min-h-0 overflow-y-auto pb-32">
        <ConversationContent className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <ConversationEmptyState
                title="Welcome to blipee"
                description="Your intelligent sustainability assistant. Ask me anything about emissions, compliance, or ESG reporting."
                icon={
                  <div className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <div className="p-3 rounded-md bg-white/90 dark:bg-gray-950/90">
                      <Bot className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                }
              />

              {/* Suggestion Chips */}
              <div className="w-full max-w-2xl">
                <Suggestions>
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      suggestion={suggestion}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </Suggestions>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  {/* Sources - Show at top if available */}
                  {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                    <Sources className="mb-3">
                      <SourcesTrigger
                        count={message.parts.filter((part) => part.type === 'source-url').length}
                      />
                      <SourcesContent>
                        {message.parts
                          .filter((part) => part.type === 'source-url')
                          .map((part, i) => (
                            <Source
                              key={`${message.id}-source-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          ))}
                      </SourcesContent>
                    </Sources>
                  )}

                  {/* Message Parts */}
                  {message.parts.map((part, i) => {
                    // Check if this is a tool part that needs approval
                    if (isToolUIPart(part)) {
                      const toolName = getToolName(part);

                      // Render confirmation UI for tools requiring approval
                      if (requiresApproval(toolName) && part.state === 'input-available') {
                        return (
                          <div key={`${message.id}-tool-${i}`} className="my-3">
                            <ToolConfirmation
                              toolName={toolName}
                              toolCallId={part.toolCallId}
                              toolInput={part.input}
                              onApprove={async (toolCallId) => {
                                await addToolResult({
                                  toolCallId,
                                  tool: toolName,
                                  output: JSON.stringify({
                                    approved: true,
                                    timestamp: new Date().toISOString(),
                                  })
                                });
                                sendMessage(); // Continue generation
                              }}
                              onDeny={async (toolCallId, reason) => {
                                await addToolResult({
                                  toolCallId,
                                  tool: toolName,
                                  output: JSON.stringify({
                                    approved: false,
                                    reason: reason || 'User declined',
                                    timestamp: new Date().toISOString(),
                                  })
                                });
                                sendMessage(); // Continue with denial
                              }}
                              requireReason={false}
                              showDetails={true}
                            />
                          </div>
                        );
                      }

                      // Render visualization tools (charts)
                      const visualizationTools = [
                        'getEmissionsTrend',
                        'getEmissionsBreakdown',
                        'getEmissionsYoYVariation',
                        'getSBTiProgress',
                        'getMonthlyConsumption',
                        'getTripAnalytics',
                        'getBuildingEnergyBreakdown'
                      ];

                      if (visualizationTools.includes(toolName)) {
                        const toolPart = part as any;

                        // Show loading skeleton during tool execution
                        if (toolPart.state === 'input-available' || toolPart.state === 'input-streaming') {
                          return (
                            <div key={`${message.id}-tool-${i}`} className="my-4">
                              <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
                                <div className="mb-4 flex items-center justify-between">
                                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                </div>
                                <div className="h-[300px] md:h-[400px] bg-gray-200 dark:bg-gray-700 rounded" />
                              </div>
                            </div>
                          );
                        }

                        // Render chart when output is available
                        if (toolPart.state === 'output-available' && toolPart.output) {
                          try {
                            const chartData = toolPart.output as ChartData;
                            return (
                              <div key={`${message.id}-tool-${i}`} className="my-4">
                                <MetricsChart data={chartData} />
                              </div>
                            );
                          } catch (error) {
                            console.error('❌ Error rendering chart:', error);
                            return (
                              <div key={`${message.id}-tool-${i}`} className="my-4">
                                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                                  <p className="text-sm text-red-700 dark:text-red-400">
                                    Failed to render chart: {error instanceof Error ? error.message : 'Unknown error'}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        }

                        // Handle error state
                        if (toolPart.state === 'output-error') {
                          return (
                            <div key={`${message.id}-tool-${i}`} className="my-4">
                              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  {toolPart.errorText || 'Failed to generate chart'}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // Return null for other states
                        return null;
                      }
                    }

                    // Handle agent messages differently (proactive AI messages)
                    if (message.role === 'agent' && part.type === 'text') {
                      const agentMeta = message as any;
                      const priority = agentMeta.priority || 'info';
                      const agentId = agentMeta.agent_id || 'unknown';

                      return (
                        <div key={`${message.id}-${i}`} className="mb-4">
                          <div className={cn(
                            "border-l-4 rounded-lg p-4 shadow-sm",
                            priority === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-950/20' :
                            priority === 'alert' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/20' :
                            'bg-blue-50 border-blue-500 dark:bg-blue-950/20'
                          )}>
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">🤖</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={cn(
                                    "font-semibold text-sm",
                                    priority === 'critical' ? 'text-red-900 dark:text-red-100' :
                                    priority === 'alert' ? 'text-yellow-900 dark:text-yellow-100' :
                                    'text-blue-900 dark:text-blue-100'
                                  )}>
                                    {agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  {priority === 'critical' && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                                      CRITICAL
                                    </span>
                                  )}
                                  {priority === 'alert' && (
                                    <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-medium">
                                      ALERT
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 text-xs rounded-full">
                                    Automated Update
                                  </span>
                                </div>
                                <Response className={cn(
                                  "text-sm leading-relaxed",
                                  priority === 'critical' ? 'text-red-800 dark:text-red-200' :
                                  priority === 'alert' ? 'text-yellow-800 dark:text-yellow-200' :
                                  'text-blue-800 dark:text-blue-200'
                                )}>
                                  {part.text}
                                </Response>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(message.createdAt || Date.now()).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            {message.role === 'user' ? (
                              /* User Message - Gray bubble on right with actions */
                              <div className="group flex flex-col items-end">
                                <div className="flex gap-2 items-center">
                                  <Message from={message.role}>
                                    <MessageContent
                                      variant="flat"
                                      className="!max-w-none !bg-gray-100 dark:!bg-gray-800 rounded-2xl px-4 py-2.5"
                                    >
                                      <Response className="text-[15px] leading-relaxed !text-gray-500 dark:!text-gray-500">
                                        {part.text}
                                      </Response>
                                    </MessageContent>
                                  </Message>
                                  {/* User Avatar */}
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-base">
                                      {getUserInitials()}
                                    </div>
                                  </div>
                                </div>
                                {/* Actions below user message */}
                                <Actions className="mt-2 mr-12 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Action
                                    onClick={() => navigator.clipboard.writeText(part.text)}
                                    label="Copy"
                                  >
                                    <CopyIcon className="size-4" />
                                  </Action>
                                </Actions>
                              </div>
                            ) : (
                              /* AI Message - Plain text on left, no bubble */
                              <div className="group">
                                <Message from={message.role}>
                                  <MessageContent variant="flat" className="max-w-full !bg-transparent !p-0">
                                    <Response className="text-[15px] leading-relaxed !text-gray-500 dark:!text-gray-500 [&_*]:!text-gray-500 dark:[&_*]:!text-gray-500">
                                      {part.text}
                                    </Response>
                                  </MessageContent>
                                </Message>
                                {/* Actions below AI message */}
                                {i === message.parts.length - 1 && (
                                  <Actions className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Action
                                      onClick={() => regenerate()}
                                      label="Regenerate"
                                    >
                                      <RefreshCcwIcon className="size-4" />
                                    </Action>
                                    <Action
                                      onClick={() => handleFeedback(message.id, 'up')}
                                      label="Good response"
                                      className={feedback[message.id] === 'up' ? 'text-green-500' : ''}
                                    >
                                      <ThumbsUpIcon className="size-4" />
                                    </Action>
                                    <Action
                                      onClick={() => handleFeedback(message.id, 'down')}
                                      label="Bad response"
                                      className={feedback[message.id] === 'down' ? 'text-red-500' : ''}
                                    >
                                      <ThumbsDownIcon className="size-4" />
                                    </Action>
                                    <Action
                                      onClick={() => navigator.clipboard.writeText(part.text)}
                                      label="Copy"
                                    >
                                      <CopyIcon className="size-4" />
                                    </Action>
                                  </Actions>
                                )}
                              </div>
                            )}
                          </Fragment>
                        );

                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full mb-3"
                            isStreaming={
                              status === 'streaming' &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>
              ))}

              {/* Loading State */}
              {status === 'submitted' && (
                <div className="flex justify-start">
                  <Loader />
                </div>
              )}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Form - Floating at bottom of chat area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-950 via-white dark:via-gray-950 to-transparent p-4 pt-12">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-3 text-gray-700 dark:text-gray-100">
          {/* Error State */}
          {error && (
            <div className="mb-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                      Something went wrong
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      {error.message || 'Please try again.'}
                    </p>
                  </div>
                  <Actions>
                    <Action onClick={() => regenerate()} label="Retry">
                      <RefreshCcwIcon className="w-3 h-3" />
                    </Action>
                  </Actions>
                </div>
              </div>
            </div>
          )}

          <PromptInput
            onSubmit={handleSubmit}
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                ref={textareaRef}
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-center justify-between">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100/90 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 data-[state=open]:bg-gradient-to-r data-[state=open]:from-green-500/20 data-[state=open]:to-emerald-500/20 data-[state=open]:border-green-500 dark:data-[state=open]:border-emerald-500 data-[state=open]:text-green-500" />
                  <PromptInputActionMenuContent className="w-56 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 rounded-2xl">
                    <PromptInputActionMenuItem className="group flex items-center gap-3 cursor-pointer hover:bg-gray-100/90 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 hover:text-gray-500 focus:text-gray-500 rounded-lg mx-1 my-1">
                      <PromptInputActionAddAttachments>
                        <PaperclipIcon className="w-4 h-4" />
                        <span>Add photos or files</span>
                      </PromptInputActionAddAttachments>
                    </PromptInputActionMenuItem>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-500">
                      Model
                    </div>

                    {AVAILABLE_MODELS.map((modelOption) => (
                      model === modelOption.id ? (
                        <PromptInputActionMenuItem
                          key={modelOption.id}
                          onClick={() => setModel(modelOption.id)}
                          className="group flex items-center gap-3 cursor-pointer !bg-gradient-to-r !from-green-500/20 !to-emerald-500/20 rounded-lg mx-1 my-1"
                        >
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{modelOption.name}</span>
                        </PromptInputActionMenuItem>
                      ) : (
                        <PromptInputActionMenuItem
                          key={modelOption.id}
                          onClick={() => setModel(modelOption.id)}
                          className="group flex items-center gap-3 cursor-pointer hover:bg-gray-100/90 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 hover:text-gray-500 focus:text-gray-500 rounded-lg mx-1 my-1"
                        >
                          <span>{modelOption.name}</span>
                        </PromptInputActionMenuItem>
                      )
                    ))}
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputSpeechButton
                  textareaRef={textareaRef}
                  onTranscriptionChange={setInput}
                  className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100/90 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gradient-to-r active:from-green-500/20 active:to-emerald-500/20 active:border-green-500 dark:active:border-emerald-500"
                />
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input.trim() && status !== 'streaming'}
                status={status}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
