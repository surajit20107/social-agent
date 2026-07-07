import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Cpu, Globe, Code2, Hash, Mail } from 'lucide-react';
import Card from '../components/ui/Card';

export default function About() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">SocialFlow AI</h1>
          <p className="text-muted-foreground">Version 1.0.0</p>
        </div>

        {/* Description */}
        <Card className="mb-6">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SocialFlow AI is an AI-powered social media management assistant that lets you manage 
            your social media accounts using natural language. Powered by OpenRouter's AI models 
            and Zenrio's API, it can create posts, schedule content, manage comments, reply to DMs, 
            and more — all through a simple chat interface.
          </p>
        </Card>

        {/* How it works */}
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            {[
              { icon: MessageSquare, title: '1. You Chat', description: 'Tell SocialFlow what you want to do in natural language.' },
              { icon: Cpu, title: '2. AI Agent Analyzes', description: 'The AI Agent understands your request and determines the required action.' },
              { icon: Globe, title: '3. Action Executed', description: 'The action is executed through Zenrio\'s API on your connected accounts.' },
              { icon: Sparkles, title: '4. Response Generated', description: 'A second AI generates a natural, user-friendly response explaining the result.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <item.icon size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tech Stack */}
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Frontend', value: 'React 19 + TypeScript' },
              { label: 'Styling', value: 'Tailwind CSS v4' },
              { label: 'Animations', value: 'Framer Motion' },
              { label: 'Icons', value: 'Lucide React' },
              { label: 'AI Models', value: 'OpenRouter' },
              { label: 'Social API', value: 'Zenrio' },
              { label: 'Storage', value: 'Local Storage' },
              { label: 'Build Tool', value: 'Vite 8' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">Capabilities</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Create Posts',
              'Schedule Posts',
              'Publish Content',
              'Manage Comments',
              'Reply to DMs',
              'Manage Accounts',
              'Multi-Platform',
              'Natural Language',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Links */}
        <div className="flex items-center justify-center gap-4">
          {[
            { icon: Code2, label: 'GitHub', href: '#' },
            { icon: Hash, label: 'Twitter', href: '#' },
            { icon: Mail, label: 'Email', href: '#' },
          ].map((link, i) => (
            <a
              key={i}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <link.icon size={16} />
              {link.label}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}