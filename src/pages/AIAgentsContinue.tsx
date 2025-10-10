import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Home, Share, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const AIAgentsContinue = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (projectId) {
      const savedMessages = localStorage.getItem(`chat_messages_${projectId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Error loading messages:', e);
        }
      }
      fetchProject();
    }
  }, [projectId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (projectId && messages.length > 0) {
      localStorage.setItem(`chat_messages_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  useEffect(() => {
    if (project) {
      updatePreview();
    }
  }, [project]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      toast({
        title: "خطأ في تحميل المشروع",
        description: error.message,
        variant: "destructive",
      });
      navigate('/dashboard');
    } else {
      setProject(data);
      // Check localStorage directly instead of state
      const savedMessages = localStorage.getItem(`chat_messages_${projectId}`);
      if (!savedMessages) {
        setMessages([
          {
            role: "assistant",
            content: "مرحباً! أنا هنا لمساعدتك في تطوير مشروعك. أخبرني ما التعديلات التي تريدها وسأقوم بتنفيذها فوراً.",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }
    setLoading(false);
  };

  const updatePreview = () => {
    if (!project) return;

    const fullHTML = project.html_code.replace(
      '</head>',
      `<style>${project.css_code}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
    ).replace(
      '</body>',
      `<script>${project.js_code}</script>
</body>`
    );
    setPreviewContent(fullHTML);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !project || isProcessing) return;

    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage("");
    setIsProcessing(true);

    // Add loading message
    const loadingMessage = {
      role: "assistant",
      content: "جاري العمل على طلبك...",
      timestamp: new Date().toISOString(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agents-continue', {
        body: {
          projectId: project.id,
          message: userMessage,
          currentCode: {
            html: project.html_code,
            css: project.css_code,
            js: project.js_code
          }
        }
      });

      if (error) throw error;

      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));

      if (data && data.success) {
        // Update project with new code
        const updatedProject = {
          ...project,
          html_code: data.code.html,
          css_code: data.code.css,
          js_code: data.code.js
        };
        setProject(updatedProject);

        // Update database
        await supabase
          .from('projects')
          .update({
            html_code: data.code.html,
            css_code: data.code.css,
            js_code: data.code.js,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id);

        // Add success message
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.message || "تم تنفيذ التعديلات بنجاح! يمكنك رؤية التغييرات في المعاينة.",
          timestamp: new Date().toISOString()
        }]);

        toast({
          title: "تم التعديل بنجاح",
          description: "تم تحديث المشروع حسب طلبك",
        });
      } else if (data && data.success === false) {
        const errMsg = data.errorMessage || "تعذر تنفيذ التعديل حالياً. حاول مجدداً بعد قليل.";
        setMessages(prev => [...prev, {
          role: "assistant",
          content: errMsg,
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "تعذر تنفيذ الطلب",
          description: errMsg,
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء معالجة طلبك",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('projects')
      .update({
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (error) {
      toast({
        title: "خطأ في النشر",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const url = project.custom_url 
        ? `${window.location.origin}/p/${project.custom_url}`
        : `${window.location.origin}/p/${project.id}`;
      
      navigator.clipboard.writeText(url);
      toast({
        title: "تم النشر بنجاح",
        description: "تم نسخ رابط المشروع إلى الحافظة",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">إكمال البناء مع الوكلاء</h1>
                <p className="text-sm text-muted-foreground">{project?.project_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={handlePublish}>
                <Share className="h-4 w-4 mr-2" />
                نشر
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="w-1/2 border-r flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`max-w-[80%] p-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-card">
            <div className="flex gap-2">
              <Textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="اكتب التعديلات التي تريدها..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || isProcessing}
                size="icon"
                className="h-[80px] w-[80px]"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              اضغط Enter للإرسال، Shift+Enter لسطر جديد
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-card border-b px-4 py-3">
            <span className="font-medium">المعاينة المباشرة</span>
          </div>
          
          <iframe
            srcDoc={previewContent}
            className="flex-1 w-full border-0"
            title="معاينة المشروع"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default AIAgentsContinue;
