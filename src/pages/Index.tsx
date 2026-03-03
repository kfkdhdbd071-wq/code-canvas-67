import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Globe, Palette, Zap, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
          <p className="text-white/60 mb-4">منصة تطوير الويب العربية الأولى</p>
          <div className="flex flex-col items-center gap-2">
            <p className="text-white/80 text-sm">تطوير: <span className="font-semibold text-white">محمد عاطف</span></p>
            <a
              href="https://wa.me/201123919317"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="bg-green-600/20 border-green-400/40 text-green-300 hover:bg-green-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                تواصل عبر واتساب
              </Button>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;