import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Settings,
  Users,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  LogOut,
  Info,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getConversations, deleteConversation, generateId } from '../../lib/storage';
import { formatRelativeTime, truncate } from '../../lib/storage';
import type { Conversation } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => getConversations());

  const refreshConversations = () => {
    setConversations(getConversations());
  };

  const handleNewChat = () => {
    const id = generateId();
    navigate(`/chat/${id}`);
    if (window.innerWidth < 1024) onToggle();
    setTimeout(refreshConversations, 100);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation(id);
    refreshConversations();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Chats' },
    { to: '/accounts', icon: Users, label: 'Accounts' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/about', icon: Info, label: 'About' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-72'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center h-14 px-4 border-b border-border ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-semibold text-sm">SocialFlow AI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors hidden lg:flex"
          >
            <ChevronRight size={16} className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-accent-soft transition-all duration-200 ${
              collapsed ? 'justify-center h-10' : 'px-3 h-10 text-sm'
            }`}
          >
            <Plus size={16} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/chat'}
              onClick={() => {
                if (window.innerWidth < 1024) onToggle();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 h-10 text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-accent-soft text-accent font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`
              }
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Conversations List */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 mt-4">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Recent Chats
            </p>
            {conversations.length === 0 ? (
              <p className="px-3 text-xs text-muted-foreground">No conversations yet</p>
            ) : (
              <div className="space-y-0.5">
                {conversations.slice(0, 20).map(conv => (
                  <NavLink
                    key={conv.id}
                    to={`/chat/${conv.id}`}
                    onClick={() => {
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{truncate(conv.title || 'New Chat', 28)}</p>
                      <p className="text-xs opacity-60">{formatRelativeTime(conv.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/50 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User & Logout */}
        <div className={`border-t border-border ${collapsed ? 'p-2' : 'p-3'}`}>
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <User size={12} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-muted-foreground hover:text-danger transition-colors text-sm w-full rounded-lg ${
              collapsed
                ? 'justify-center h-10 w-10 mx-auto'
                : 'px-3 h-10 hover:bg-muted/30'
            }`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}