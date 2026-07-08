import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Cpu, Globe, Save, Eye, EyeOff, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { chatWithOpenRouter } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: 'mistralai/mistral-7b', name: 'Mistral 7B', provider: 'Mistral' },
  { id: 'custom', name: 'Custom Model', provider: 'Other' },
];

export default function SettingsPage() {
  const { settings, updateSetting, isConfigured } = useSettings();
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showZenrioKey, setShowZenrioKey] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved successfully!');
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    if (!settings.openRouterApiKey) {
      toast.error('Please enter an OpenRouter API key first');
      return;
    }

    setTesting(true);
    setTestResult('idle');
    try {
      const response = await chatWithOpenRouter(
        [{ role: 'user', content: 'Say "Hello! Connection successful." and nothing else.' }],
        'You are a test assistant. Respond with exactly: "Hello! Connection successful."'
      );
      if (response.includes('successful')) {
        setTestResult('success');
        toast.success('OpenRouter connection successful!');
      } else {
        setTestResult('failed');
        toast.error('Unexpected response from API');
      }
    } catch (error: any) {
      setTestResult('failed');
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your API keys and AI model preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
              <Key size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">API Keys</h2>
                  <p className="text-xs text-muted-foreground">Connect to OpenRouter and Zernio</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                label="OpenRouter API Key"
                type={showOpenRouterKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={settings.openRouterApiKey}
                onChange={(e) => updateSetting('openRouterApiKey', e.target.value)}
                icon={<Key size={16} />}
              />
              <button
                type="button"
                onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOpenRouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {settings.openRouterApiKey && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  loading={testing}
                  icon={testResult === 'success' ? <Check size={14} /> : testResult === 'failed' ? <AlertCircle size={14} /> : <RefreshCw size={14} />}
                >
                  {testing ? 'Testing...' : testResult === 'success' ? 'Connected' : testResult === 'failed' ? 'Retry' : 'Test Connection'}
                </Button>
                {testResult === 'success' && (
                  <Badge variant="success">API Key Valid</Badge>
                )}
                {testResult === 'failed' && (
                  <Badge variant="danger">Connection Failed</Badge>
                )}
              </div>
            )}

            <div className="relative">
              <Input
                label="Zernio API Key"
                type={showZenrioKey ? 'text' : 'password'}
                placeholder="sk_..."
                value={settings.zenrioApiKey}
                onChange={(e) => updateSetting('zenrioApiKey', e.target.value)}
                icon={<Globe size={16} />}
              />
              <button
                type="button"
                onClick={() => setShowZenrioKey(!showZenrioKey)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showZenrioKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </Card>

        {/* AI Model Selection */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
              <Cpu size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Model</h2>
              <p className="text-xs text-muted-foreground">Choose the AI model for processing</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              OpenRouter Model
            </label>
            <div className="grid gap-2">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => updateSetting('openRouterModel', model.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all duration-200 ${
                    settings.openRouterModel === model.id
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-input text-foreground hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      settings.openRouterModel === model.id ? 'border-accent' : 'border-muted-foreground'
                    }`}>
                      {settings.openRouterModel === model.id && (
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.provider}</p>
                    </div>
                  </div>
                  {model.provider !== 'Other' && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      Free
                    </span>
                  )}
                </button>
              ))}
            </div>

            {settings.openRouterModel === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <Input
                  label="Custom Model ID"
                  placeholder="provider/model-name"
                  value={settings.customModel}
                  onChange={(e) => updateSetting('customModel', e.target.value)}
                />
              </motion.div>
            )}
          </div>
        </Card>

        {/* Configuration Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isConfigured ? 'bg-success/10' : 'bg-warning/10'
              }`}>
                {isConfigured ? (
                  <Check size={18} className="text-success" />
                ) : (
                  <AlertCircle size={18} className="text-warning" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm">Configuration Status</h2>
                <p className="text-xs text-muted-foreground">
                  {isConfigured
                    ? 'All API keys are configured. You\'re ready to use SocialFlow AI.'
                    : 'Please configure both OpenRouter and Zernio API keys to use the application.'}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} icon={saved ? <Check size={16} /> : <Save size={16} />}>
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}