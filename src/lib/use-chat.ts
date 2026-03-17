// useChat hook - manages LEEE conversation state and streaming
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  stage?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface SessionMeta {
  session_id: string;
  stage: string;
  stories_completed: number;
  should_end: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Create placeholder for streaming assistant message
    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: content.trim(),
          user_id: 'demo-user', // TODO: real auth
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6); // remove 'data: '
          try {
            const data = JSON.parse(jsonStr);

            if (data.done) {
              // Final metadata
              setSessionId(data.session_id);
              setSessionMeta(data);
              if (data.should_end) {
                setIsSessionComplete(true);
              }
            } else if (data.text) {
              fullText += data.text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullText, isStreaming: true }
                    : m
                )
              );
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      // Mark streaming complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: fullText, isStreaming: false, stage: sessionMeta?.stage }
            : m
        )
      );

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, sessionMeta]);

  const runExtraction = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract', session_id: sessionId }),
      });

      if (!response.ok) throw new Error('Extraction failed');
      const result = await response.json();
      setExtractionResult(result);
      return result;
    } catch (error) {
      console.error('Extraction error:', error);
    }
  }, [sessionId]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setSessionMeta(null);
    setIsSessionComplete(false);
    setExtractionResult(null);
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    sessionMeta,
    isSessionComplete,
    extractionResult,
    sendMessage,
    runExtraction,
    resetChat,
  };
}
