import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Calendar, Users, Settings, ArrowRight, Globe, Camera, Hash, Link2 } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: 'Natural Language Control',
      description: 'Manage your social media using everyday language. Just tell SocialFlow what you want to do.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Schedule posts across multiple platforms with intelligent timing suggestions.',
    },
    {
      icon: Users,
      title: 'Multi-Platform',
      description: 'Connect and manage Instagram, LinkedIn, X (Twitter), Facebook, and more.',
    },
    {
      icon: Settings,
      title: 'AI-Powered',
      description: 'Leverage two AI models working together to understand and execute your requests.',
    },
  ];

  const platforms = [
    { icon: Camera, name: 'Instagram', color: '#E4405F' },
    { icon: Hash, name: 'X (Twitter)', color: '#1DA1F2' },
    { icon: Link2, name: 'LinkedIn', color: '#0A66C2' },
    { icon: Globe, name: 'Facebook', color: '#1877F2' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm">SocialFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-medium mb-6">
              <Sparkles size={12} />
              AI-Powered Social Media Management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Manage Your Social Media
              <br />
              <span className="text-gradient-accent">with Natural Language</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              SocialFlow AI understands your requests and executes social media actions automatically. 
              Just chat with it like you would with a human assistant.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Get Started Free
                <ArrowRight size={16} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-6 mt-12"
          >
            {platforms.map((platform, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                <platform.icon size={18} style={{ color: platform.color }} />
                <span>{platform.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to transform your social media workflow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { step: '01', title: 'Connect', description: 'Link your social media accounts through Zenrio and configure your AI settings.' },
              { step: '02', title: 'Chat', description: 'Tell SocialFlow what you want to do in natural language - just like talking to an assistant.' },
              { step: '03', title: 'Execute', description: 'The AI handles the rest - creating posts, scheduling content, managing engagement.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative p-6 rounded-xl border border-border bg-card"
              >
                <span className="text-3xl font-bold text-accent/30">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center mb-3">
                  <feature.icon size={18} className="text-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-sm text-muted-foreground">SocialFlow AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SocialFlow AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}