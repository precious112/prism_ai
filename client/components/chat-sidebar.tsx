'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { chatApi } from '@/lib/api';
import { Chat } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, MoreVertical, Pencil, Trash, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ChatSidebarProps {
  className?: string;
  onSelect?: () => void; // For closing mobile sheet on select
}

export function ChatSidebar({ className, onSelect }: ChatSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const activeChatId = params?.chatId as string;
  
  const { user } = useAuthStore();
  const { chats, setChats, addChat, updateChat, removeChat } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (user?.id) {
      chatApi.getChats(user.id)
        .then(fetchedChats => {
            setChats(fetchedChats);
        })
        .catch(err => console.error('Failed to fetch chats', err));
    }
  }, [user?.id, setChats]);

  const handleNewChat = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const newChat = await chatApi.createChat(user.id);
      addChat(newChat);
      router.push(`/chat/${newChat.id}`);
      if (onSelect) onSelect();
    } catch (error) {
      console.error('Failed to create chat', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    if (onSelect) onSelect();
  };

  const handleRenameStart = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title || "");
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChatId) return;
    try {
        await chatApi.updateChat(editingChatId, editTitle);
        updateChat(editingChatId, { title: editTitle });
        setEditingChatId(null);
    } catch (err) {
        console.error("Failed to rename chat", err);
    }
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
        await chatApi.deleteChat(chatId);
        removeChat(chatId);
        if (activeChatId === chatId) {
            router.push('/');
        }
    } catch (err) {
        console.error("Failed to delete chat", err);
    }
  };

  return (
    <div className={cn("pb-12 h-full border-r bg-background", className)}>
      <div className="space-y-4 py-4 h-full flex flex-col">
        <div className="px-3 py-2">
          <Button onClick={handleNewChat} disabled={loading} className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-hidden px-3">
            <ScrollArea className="h-full">
                <div className="space-y-1">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={cn(
                          "group flex items-center w-full rounded-md px-2 py-1 hover:bg-accent/50",
                          activeChatId === chat.id ? "bg-accent" : "transparent"
                        )}
                      >
                        {editingChatId === chat.id ? (
                          <form
                            onSubmit={handleRenameSubmit}
                            className="flex-1 flex items-center gap-1"
                          >
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 text-sm px-2"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </form>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start gap-2 font-normal truncate h-auto p-0 hover:bg-transparent"
                              onClick={() => handleChatSelect(chat.id)}
                            >
                              <MessageSquare className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate text-left w-full">
                                {chat.title || "Untitled Chat"}
                              </span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => handleRenameStart(chat, e)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleDelete(chat.id, e)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    ))}
                    {chats.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2 text-center">
                            No chats yet.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
      </div>
    </div>
  );
}
