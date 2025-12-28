'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { chatApi } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AVAILABLE_MODELS = [
  {
    provider: "OpenAI",
    models: [
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3-mini", name: "o3-mini" },
    ],
  },
  {
    provider: "Anthropic",
    models: [
      { id: "claude-opus-4-1", name: "Claude Opus 4.1" },
      { id: "claude-opus-4", name: "Claude Opus 4" },
      { id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      { id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku" },
    ],
  },
  {
    provider: "Google",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
      { id: "gemini-3-pro", name: "Gemini 3 Pro" },
      { id: "gemini-3-flash", name: "Gemini 3 Flash" },
    ],
  },
  {
    provider: "xAI",
    models: [
      { id: "grok-4", name: "Grok 4" },
      { id: "grok-4.1-fast", name: "Grok 4.1 Fast" },
      { id: "grok-3", name: "Grok 3" },
      { id: "x-ai/grok-3-mini-beta", name: "Grok 3 Mini Beta" },
    ],
  },
];

const getProviderForModel = (modelId: string) => {
  for (const group of AVAILABLE_MODELS) {
    if (group.models.find((m) => m.id === modelId)) {
      return group.provider;
    }
  }
  return 'OpenAI';
};

export default function NewChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addChat, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem('selectedModel', value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log('handleSubmit called', { input, sending, userId: user?.id });
    
    if (!input.trim()) {
        console.log('Input is empty');
        return;
    }
    if (sending) {
        console.log('Already sending');
        return;
    }
    if (!user?.id) {
        console.error('User ID is missing');
        // Maybe show an error toast here
        return;
    }

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
        console.log('Creating chat...');
        // 1. Create a new chat
        const newChat = await chatApi.createChat(user.id);
        addChat(newChat);

        // 2. Optimistically add user message (optional, as we are redirecting)
        // Ideally, we want to show the message immediately on the next page.
        // We can pass it via state or just let the next page fetch/socket handle it.
        // But for "feeling fast", let's just send it.

        const provider = getProviderForModel(selectedModel);
        
        // 3. Send the message to the new chat
        await chatApi.sendMessage(newChat.id, content, selectedModel, provider);

        // 4. Redirect to the new chat page
        router.push(`/chat/${newChat.id}`);
        
    } catch (error) {
        console.error('Failed to create chat or send message', error);
        // Handle error (maybe show a toast)
    } finally {
        setSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8 text-center">
            <div className="space-y-4">
                <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src="/prism_ai_logo.jpeg" alt="Prism AI Logo" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        <Bot className="h-10 w-10" />
                    </AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold tracking-tight">How can I help you today?</h1>
                <p className="text-muted-foreground text-lg">
                    I'm Prism AI, capable of deep web research and complex reasoning.
                </p>
            </div>
        </div>
      </div>

      <div className="p-4 bg-background">
        <div className="max-w-3xl mx-auto relative">
            <div className="mb-2 flex justify-center">
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-[180px] bg-background border-border/50">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((group) => (
                      <SelectGroup key={group.provider}>
                        <SelectLabel>{group.provider}</SelectLabel>
                        {group.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <form onSubmit={handleSubmit} className="relative">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="pr-12 resize-none py-3 shadow-lg border-muted-foreground/20"
                    rows={1}
                    style={{ minHeight: '50px' }}
                    autoFocus
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || sending}
                    className="absolute right-2 bottom-2 h-8 w-8"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
