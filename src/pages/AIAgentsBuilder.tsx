import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AIAgentsBuilder = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [projectData, setProjectData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const agents = [
    { id: "html_agent", name: "وكيل HTML", description: "كتابة الهيكل الأساسي" },
    { id: "css_agent", name: "وكيل CSS", description: "تصميم الموقع" },
    { id: "js_agent", name: "وكيل JavaScript", description: "إضافة التفاعلية" },
    { id: "review_agent", name: "وكيل المراجعة", description: "مراجعة وتحسين الكود" },
    { id: "publish_agent", name: "وكيل النشر", description: "نشر المشروع" },
  ];

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload: any) => {
          setStatus(payload.new.ai_agents_status);
          setProgress(payload.new.ai_agents_progress || 0);
          setProjectData(payload.new);
          setMessages(Array.isArray(payload.new.agent_messages) ? payload.new.agent_messages : []);

          if (payload.new.ai_agents_status === 'completed') {
            toast({
              title: "✅ اكتمل البناء!",
              description: "تم بناء ونشر مشروعك بنجاح",
            });
          }
        }
      )
      .subscribe();

    fetchProject();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Polling fallback in case realtime is not available
  useEffect(() => {
    if (!projectId) return;
    if (status === 'completed') return;

    const interval = setInterval(() => {
      fetchProject();
    }, 4000);

    return () => clearInterval(interval);
  }, [projectId, status]);

  const fetchProject = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (data) {
      setStatus(data.ai_agents_status);
      setProgress(data.ai_agents_progress || 0);
      setProjectData(data);
      setMessages(Array.isArray(data.agent_messages) ? data.agent_messages : []);
    }
  };

  const getAgentStatus = (agentId: string) => {
    if (!status) return "pending";
    const agentIndex = agents.findIndex(a => a.id === agentId);
    const currentIndex = agents.findIndex(a => a.id === status);
    
    if (currentIndex > agentIndex || status === "completed") return "completed";
    if (currentIndex === agentIndex) return "working";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8" role="main" aria-live="polite">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🤖 وكلاء الذكاء الاصطناعي
          </h1>
          <p className="text-muted-foreground">
            يعمل فريق الوكلاء على بناء مشروعك الآن...
          </p>
        </div>

        <Card className="p-6 mb-6 border-2">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">التقدم الإجمالي</span>
              <span className="text-primary font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          {projectData?.project_name && (
            <div className="text-sm text-muted-foreground">
              المشروع: <span className="font-medium text-foreground">{projectData.project_name}</span>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {agents.map((agent, index) => {
            const agentStatus = getAgentStatus(agent.id);
            
            return (
              <Card
                key={agent.id}
                className={`p-6 transition-all duration-300 ${
                  agentStatus === "working"
                    ? "border-2 border-primary shadow-lg scale-105"
                    : agentStatus === "completed"
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {agentStatus === "completed" ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : agentStatus === "working" ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                  </div>

                  {agentStatus === "working" && (
                    <div className="flex-shrink-0">
                      <div className="animate-pulse text-primary font-medium">
                        جاري العمل...
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {messages.length > 0 && (
          <Card className="p-6 mt-6 border-2 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              💬 محادثات الوكلاء
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((msg: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex gap-3 items-start p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-grow">
                    <div className="font-medium text-sm text-primary mb-1">
                      {msg.agent}
                    </div>
                    <div className="text-sm text-foreground/80">
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {status === "completed" && (
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => navigate(`/editor/${projectId}`)}
              className="flex-1"
              size="lg"
            >
              فتح المحرر <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => {
                const identifier = projectData?.custom_url || projectId;
                window.open(`/p/${identifier}`, '_blank');
              }}
              variant="outline"
              size="lg"
            >
              عرض الموقع المنشور
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentsBuilder;
