import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Trash2, Download, Loader2, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@shared/schema";

interface ChatPanelProps {
  auditId: string;
  auditName: string;
}

export function ChatPanel({ auditId, auditName }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: history = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${auditId}`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", "/api/chat", {
        auditId,
        message: msg
      });
      return (res as Response).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${auditId}`] });
      setMessage("");
    },
    onError: (error: any) => {
      // Refresh chat history even on error because user message is already saved
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${auditId}`] });
      setMessage("");
      
      let errorMessage = "Gagal mengirim pesan. Silakan coba lagi.";
      
      // Try to extract userMessage from API error response
      try {
        const errorText = error?.message || String(error);
        const match = errorText.match(/\d+:\s*(.+)/);
        if (match) {
          const jsonPart = match[1];
          const errorData = JSON.parse(jsonPart);
          if (errorData.userMessage) {
            errorMessage = errorData.userMessage;
          }
        }
      } catch {
        // Use default message if parsing fails
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/chat/${auditId}`);
      return (res as Response).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${auditId}`] });
      toast({
        title: "Riwayat dihapus",
        description: "Riwayat chat telah berhasil dihapus."
      });
    }
  });

  const exportChat = () => {
    const chatText = history
      .map(msg => `[${msg.role.toUpperCase()}] ${msg.content}`)
      .join("\n\n");
    
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${auditName}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Find the ScrollArea viewport element
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      // Scroll to the bottom smoothly
      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [history, sendMessageMutation.isPending]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">AI Coach</h3>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={exportChat}
            disabled={history.length === 0}
            data-testid="button-export-chat"
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={history.length === 0 || clearHistoryMutation.isPending}
            data-testid="button-clear-chat"
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-start justify-start h-full px-4 py-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 sm:p-5 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-foreground mb-2">
                    Selamat datang di AI Coach! 👋
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">
                    Sebelum kita mulai, mohon perkenalkan diri Anda terlebih dahulu agar diskusi lebih personal dan terarah:
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold shrink-0">1.</span>
                      <span className="text-muted-foreground">Siapa <strong className="text-foreground">nama</strong> Anda?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold shrink-0">2.</span>
                      <span className="text-muted-foreground">Apa <strong className="text-foreground">posisi/jabatan</strong> Anda?</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold shrink-0">3.</span>
                      <div className="text-muted-foreground">
                        Chat ini untuk <strong className="text-foreground">siapa</strong>?
                        <ul className="ml-4 mt-1 space-y-1 list-disc">
                          <li>Untuk <strong className="text-foreground">diri sendiri</strong> (refleksi performa Anda)</li>
                          <li>Untuk <strong className="text-foreground">bawahan/team</strong> Anda (sebutkan namanya)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-4 font-medium">
                    💡 Contoh: "Halo, saya Budi, posisi SBM. Chat ini untuk diskusi performa bawahan saya, Andi (BC)."
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center w-full">
              Setelah perkenalan, Anda bisa bertanya apa saja tentang audit, strategi improvement, atau coaching! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 pb-6">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${idx}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-md p-2.5 sm:p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-md p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            {/* Invisible anchor for auto-scroll */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </ScrollArea>

      <Separator />
      
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
          💬 <span className="font-medium">Mari kita diskusikan hasil auditnya!</span> Tanya apa saja tentang performa, rekomendasi, atau strategi improvement Anda.
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ketik pertanyaan Anda disini..."
            disabled={sendMessageMutation.isPending}
            data-testid="input-chat-message"
            className="flex-1 text-sm h-9 sm:h-10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
