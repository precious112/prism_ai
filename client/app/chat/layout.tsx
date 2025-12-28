'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { ChatSidebar } from '@/components/chat-sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
          <ChatSidebar className="h-full w-full" />
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 flex items-center px-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <SheetTitle className="sr-only">Chat Navigation</SheetTitle>
                    <ChatSidebar onSelect={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>
            <div className="ml-4 font-semibold">Prism AI</div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:pl-64 h-full pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
