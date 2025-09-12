import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Globe, Palette, Zap, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ArticleSection from "@/components/ArticleSection";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGetStarted = async () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">كودر</span>
          </div>
          <Button 
            variant="outline" 
            className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary"
            onClick={handleGetStarted}
          >
            {user ? "لوحة التحكم" : "تسجيل الدخول"}
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            اصنع مواقعك
            <br />
            <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
              بسهولة ومتعة
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            منصة تطوير ويب عربية تتيح لك إنشاء وتطوير المواقع بـ HTML وCSS وJavaScript 
            مع معاينة مباشرة ومشاركة فورية
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4 h-auto"
              onClick={handleGetStarted}
            >
              <Zap className="mr-2" />
              ابدأ الآن مجاناً
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 h-auto bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary"
            >
              <Globe className="mr-2" />
              شاهد الأمثلة
            </Button>
          </div>
        </div>

        {/* Editor Preview */}
        <div className="animate-float">
          <Card className="max-w-4xl mx-auto bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-8">
              <div className="bg-card rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-muted p-4 border-b flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground mr-4">محرر كودر</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 h-64">
                  <div className="p-4 border-r border-border">
                    <div className="text-xs text-muted-foreground mb-2">HTML</div>
                    <div className="font-mono text-sm space-y-1">
                      <div>&lt;h1&gt;مرحباً بالعالم&lt;/h1&gt;</div>
                      <div>&lt;p&gt;أول موقع لي&lt;/p&gt;</div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-2">المعاينة المباشرة</div>
                    <div className="mt-4">
                      <h2 className="text-lg font-bold">مرحباً بالعالم</h2>
                      <p className="text-muted-foreground">أول موقع لي</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">لماذا كودر؟</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            كل ما تحتاجه لتطوير مواقع احترافية في مكان واحد
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="h-8 w-8" />,
              title: "معاينة مباشرة",
              description: "شاهد التغييرات فور كتابة الكود بدون الحاجة لإعادة تحميل"
            },
            {
              icon: <Globe className="h-8 w-8" />,
              title: "نشر فوري",
              description: "انشر موقعك واحصل على رابط مخصص للمشاركة في ثوانِ"
            },
            {
              icon: <Palette className="h-8 w-8" />,
              title: "محرر متقدم",
              description: "واجهة سهلة مع دعم HTML وCSS وJavaScript"
            },
            {
              icon: <Users className="h-8 w-8" />,
              title: "مشاركة سهلة",
              description: "شارك مشاريعك مع الآخرين عبر روابط مخصصة"
            },
            {
              icon: <Shield className="h-8 w-8" />,
              title: "حفظ آمن",
              description: "مشاريعك محفوظة بأمان في السحابة"
            },
            {
              icon: <Code className="h-8 w-8" />,
              title: "كود نظيف",
              description: "أدوات تساعدك على كتابة كود منظم وجميل"
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-lg hover:bg-white/20 transition-smooth">
              <CardHeader>
                <div className="text-accent mb-4">{feature.icon}</div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Articles Section */}
      <ArticleSection />

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">
            جاهز لبناء موقعك الأول؟
          </h2>
          <p className="text-xl text-white/80 mb-12">
            انضم لآلاف المطورين الذين يستخدمون كودر لبناء مواقع رائعة
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            className="text-xl px-12 py-6 h-auto"
            onClick={handleGetStarted}
          >
            <Code className="mr-2" />
            ابدأ التطوير الآن
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">كودر</span>
          </div>
          <p className="text-white/60">منصة تطوير الويب العربية الأولى</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;