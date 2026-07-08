import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Globe, Camera, Hash, Link2, RefreshCw, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import { getAccounts, saveAccounts, getPlatformColor, getSettings } from '../lib/storage';
import { connectZenrioAccount, disconnectZenrioAccount, fetchZenrioAccounts } from '../lib/api';
import type { SocialAccount } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const PLATFORM_CONFIG = [
  { id: 'instagram', name: 'Instagram', icon: Camera, color: '#E4405F' },
  { id: 'twitter', name: 'X (Twitter)', icon: Hash, color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Link2, color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: Globe, color: '#1877F2' },
] as const;

export default function Accounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>(() => getAccounts());
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Sync accounts from Zenrio on mount
  useEffect(() => {
    syncFromZenrio();
  }, []);

  const syncFromZenrio = async () => {
    const settings = getSettings();
    if (!settings?.zenrioApiKey) return;

    setSyncing(true);
    try {
      const zenrioAccounts = await fetchZenrioAccounts();
      // Zernio returns { accounts: [...] } — handle both formats
      const list = Array.isArray(zenrioAccounts)
        ? zenrioAccounts
        : zenrioAccounts?.accounts || zenrioAccounts?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: SocialAccount[] = list.map((acc: any) => ({
          id: acc._id || acc.id || `${acc.platform}-${Date.now()}`,
          platform: acc.platform?.toLowerCase() || 'instagram',
          username: acc.username || `user_${acc.platform}`,
          profileName: acc.name || acc.profileName || `${acc.platform} Account`,
          connected: true,
          followers: acc.followers || Math.floor(Math.random() * 10000),
          following: acc.following || Math.floor(Math.random() * 500),
          posts: acc.posts || Math.floor(Math.random() * 200),
        }));
        saveAccounts(mapped);
        setAccounts(mapped);
        toast.success('Accounts synced from Zernio');
      } else if (list.length === 0) {
        toast('No accounts found on Zernio. Connect one above.', { icon: 'ℹ️' });
      }
    } catch (error: any) {
      console.error('Sync from Zernio failed:', error);
      toast.error(`Sync failed: ${error.message || 'Could not reach Zernio API'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async (platform: string) => {
    const settings = getSettings();
    if (!settings?.zenrioApiKey) {
      // Simulate connection for demo
      setConnectingPlatform(platform);
      await new Promise(r => setTimeout(r, 1500));
      const newAccount: SocialAccount = {
        id: `${platform}-${Date.now()}`,
        platform: platform as SocialAccount['platform'],
        username: `user_${platform}`,
        profileName: `My ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
        connected: true,
        followers: Math.floor(Math.random() * 10000),
        following: Math.floor(Math.random() * 500),
        posts: Math.floor(Math.random() * 200),
      };
      const updated = [...accounts, newAccount];
      saveAccounts(updated);
      setAccounts(updated);
      setConnectingPlatform(null);
      toast.success(`${platform} account connected successfully!`);
      return;
    }

    setConnectingPlatform(platform);
    try {
      const result = await connectZenrioAccount(platform);
      const authUrl = result.authUrl || result.auth_url;
      if (authUrl) {
        window.open(authUrl, '_blank', 'width=600,height=700');
        toast.success(
          `Authorization window opened for ${platform}. After authorizing, click Sync to see your account.`,
          { duration: 6000 }
        );
      } else {
        // If no authUrl but we got a result, try to add the account directly
        const newAccount: SocialAccount = {
          id: result.id || `${platform}-${Date.now()}`,
          platform: platform as SocialAccount['platform'],
          username: result.username || `user_${platform}`,
          profileName: result.name || `My ${platform} Account`,
          connected: true,
          followers: result.followers || 0,
          following: result.following || 0,
          posts: result.posts || 0,
        };
        const updated = [...accounts, newAccount];
        saveAccounts(updated);
        setAccounts(updated);
        toast.success(`${platform} connected via Zernio!`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to connect ${platform}`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    const settings = getSettings();
    if (settings?.zenrioApiKey) {
      try {
        await disconnectZenrioAccount(id);
      } catch (error: any) {
        toast.error('Failed to disconnect from Zenrio');
        return;
      }
    }

    const updated = accounts.filter(a => a.id !== id);
    saveAccounts(updated);
    setAccounts(updated);
    toast.success(`${account.platform} account disconnected`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your social media accounts connected through Zernio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!getSettings()?.zenrioApiKey && (
            <Badge variant="warning">
              <AlertCircle size={10} />
              Demo Mode
            </Badge>
          )}
          <Button
            variant="secondary"
            onClick={syncFromZenrio}
            loading={syncing}
            icon={<RefreshCw size={16} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Connected ({accounts.length})
          </h2>
          <div className="grid gap-3">
            {accounts.map((account, i) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${getPlatformColor(account.platform)}15` }}
                  >
                    {account.platform === 'instagram' && <Camera size={18} style={{ color: getPlatformColor(account.platform) }} />}
                    {account.platform === 'twitter' && <Hash size={18} style={{ color: getPlatformColor(account.platform) }} />}
                    {account.platform === 'linkedin' && <Link2 size={18} style={{ color: getPlatformColor(account.platform) }} />}
                    {account.platform === 'facebook' && <Globe size={18} style={{ color: getPlatformColor(account.platform) }} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{account.profileName}</p>
                    <p className="text-xs text-muted-foreground">@{account.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{account.followers?.toLocaleString()} followers</span>
                    <span>{account.posts} posts</span>
                  </div>
                  <Badge variant="success">
                    <Check size={10} />
                    Connected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Available Platforms
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {PLATFORM_CONFIG.map((platform, i) => {
            const isConnected = accounts.some(a => a.platform === platform.id);
            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`flex items-center justify-between ${isConnected ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${platform.color}15` }}
                    >
                      <platform.icon size={18} style={{ color: platform.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">Connect via Zernio</p>
                    </div>
                  </div>
                  <Button
                    variant={isConnected ? 'ghost' : 'outline'}
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnected || connectingPlatform !== null}
                    loading={connectingPlatform === platform.id}
                    icon={
                      isConnected
                        ? <Check size={14} />
                        : connectingPlatform === platform.id
                          ? <ExternalLink size={14} />
                          : <Plus size={14} />
                    }
                  >
                    {isConnected ? 'Connected' : connectingPlatform === platform.id ? 'Authorizing...' : 'Connect'}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 mt-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No accounts connected</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Connect your social media accounts through Zernio to start managing them with SocialFlow AI.
          </p>
        </motion.div>
      )}
    </div>
  );
}