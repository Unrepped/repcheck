'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { RealEstateChecklist, ChecklistItem } from './real-estate-checklist';
import { type QuestionCategory } from '@/lib/ai/real-estate/types';
import { InterviewStart } from './interview-start';
import { AnimatePresence, motion } from 'framer-motion';
import { SuggestedResponses } from './suggested-responses';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const ALL_CATEGORIES: QuestionCategory[] = [
    'agent_relationship',
    'local_knowledge',
    'process_familiarity',
    'communication_availability',
    'budget_fees',
    'loan_eligibility',
    'property_type',
    'lifestyle_cultural_fit',
  ];

  useEffect(() => {
    // Find all assistant messages with tool outputs
    const newChecklistItems: ChecklistItem[] = [];
    const userAnswers: Record<string, string> = {};
    let lastToolQuestionId: string | null = null;
    let lastToolCategory: string | null = null;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'assistant' && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part && (part as any).type === 'tool') {
            const toolPart = part as unknown as {
              type: 'tool';
              toolName: string;
              result: any;
            };
            if (
              toolPart.toolName === 'addQuestion' &&
              toolPart.result &&
              toolPart.result.question &&
              toolPart.result.explanation &&
              toolPart.result.category
            ) {
              lastToolQuestionId = toolPart.result.id;
              lastToolCategory = toolPart.result.category;
              // Avoid duplicates by id
              if (!newChecklistItems.find((i) => i.id === toolPart.result.id)) {
                newChecklistItems.push({
                  id: toolPart.result.id,
                  category: toolPart.result.category,
                  question: toolPart.result.question,
                  explanation: toolPart.result.explanation,
                });
              }
            }
          }
        }
      }
      // If the last message was an addQuestion tool, the next user message is the answer
      if (
        lastToolQuestionId &&
        msg.role === 'user' &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
      ) {
        userAnswers[lastToolQuestionId] = msg.content.trim();
        lastToolQuestionId = null;
        lastToolCategory = null;
      }
    }
    // Attach answers to checklist items
    const checklistWithAnswers = newChecklistItems.map((item) => ({
      ...item,
      answer: userAnswers[item.id],
    }));
    setChecklist(checklistWithAnswers);
    // Track completed categories
    const completed: string[] = [];
    for (const cat of ALL_CATEGORIES) {
      if (checklistWithAnswers.some((item) => item.category === cat && item.answer)) {
        completed.push(cat);
      }
    }
    setCompletedCategories(completed);
    // Completion: all categories have at least one answered question
    setIsComplete(completed.length === ALL_CATEGORIES.length);
  }, [messages]);

  const [showInterview, setShowInterview] = useState(messages.length > 0);

  // When user clicks Start Interview, show chat and send initial assistant message
  const handleStartInterview = () => {
    setShowInterview(true);
    // If there are no messages, send the initial assistant message
    if (messages.length === 0) {
      setMessages([
        {
          id: 'initial-assistant',
          role: 'assistant',
          parts: [{ type: 'text', text: "Hi! I'm here to help you prepare for your real estate agent interview. Let's start by understanding your situation better. Are you currently working with a real estate agent, or are you looking to find one?" }],
          content: "Hi! I'm here to help you prepare for your real estate agent interview. Let's start by understanding your situation better. Are you currently working with a real estate agent, or are you looking to find one?",
          createdAt: new Date(),
          experimental_attachments: [],
        },
      ]);
    }
  };

  // Extract suggestions from the latest assistant message (code block labeled suggestedResponses)
  const latestAssistant = messages.slice().reverse().find((m) => m.role === 'assistant');
  let suggestedResponses: string[] = [];
  if (latestAssistant && Array.isArray(latestAssistant.parts)) {
    for (const part of latestAssistant.parts) {
      // Check for code block labeled suggestedResponses
      if (
        part &&
        typeof part === 'object' &&
        'type' in part &&
        part.type === 'text' &&
        typeof part.text === 'string'
      ) {
        const codeBlockMatch = part.text.match(/```suggestedResponses\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            const arr = JSON.parse(codeBlockMatch[1].trim());
            if (Array.isArray(arr)) {
              suggestedResponses = arr;
              break;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  // Handler for clicking a suggested response
  const handleSelectSuggestion = (text: string) => {
    append({ role: 'user', content: text });
  };

  return (
    <div className="flex min-h-screen">
      <AnimatePresence mode="wait">
        {!showInterview ? (
          <motion.div
            key="interview-start"
            className="flex flex-1 items-center justify-center h-dvh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <InterviewStart onStart={handleStartInterview} />
          </motion.div>
        ) : (
          <motion.div
            key="chat-main"
            className="flex flex-1 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col min-w-0 h-dvh bg-background flex-1">
              <ChatHeader
                chatId={id}
                selectedModelId={initialChatModel}
                selectedVisibilityType={initialVisibilityType}
                isReadonly={isReadonly}
                session={session}
              />

              <Messages
                chatId={id}
                status={status}
                votes={votes}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                isArtifactVisible={isArtifactVisible}
              />

              <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl flex-col items-center">
                <SuggestedResponses suggestions={suggestedResponses} onSelect={handleSelectSuggestion} />
                {!isReadonly && (
                  <MultimodalInput
                    chatId={id}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    setMessages={setMessages}
                    append={append}
                    selectedVisibilityType={visibilityType}
                  />
                )}
              </form>
            </div>
            {/* Checklist panel */}
            <RealEstateChecklist
              items={checklist}
              totalSteps={8}
              currentStep={completedCategories.length + 1}
              completedCategories={completedCategories}
              isComplete={isComplete}
            />
            <Artifact
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              append={append}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              votes={votes}
              isReadonly={isReadonly}
              selectedVisibilityType={visibilityType}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
