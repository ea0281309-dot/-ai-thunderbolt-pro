import React, { useState } from 'react';
import { Zap, Mic, Bot, Phone, BarChart3, Settings, Menu, X, type LucideIcon } from 'lucide-react';
import { Toaster } from 'sonner';
import { VoiceManager } from '@/components/voices/VoiceManager';
import { clsx } from 'clsx';

type Tab = 'dashboard' | 'voices' | 'agents' | 'calls' | 'analytics' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'voices', label: 'Voices', icon: Mic },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ComingSoon: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24">
    <div className="rounded-full bg-gray-800 p-6">
      <Zap size={32} className="text-indigo-400" />
    </div>
    <div className="text-center">
      <h2 className="text-xl font-semibold text-white">{label}</h2>
      <p className="mt-2 text-gray-400">This section is coming soon.</p>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('voices');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <div className="flex h-screen overflow-hidden bg-gray-950">
        {/* Sidebar */}
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
            <div className="rounded-lg bg-indigo-600 p-2">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">AI Thunderbolt</p>
              <p className="text-xs text-indigo-400">Pro</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={clsx(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-800 px-6 py-4">
            <p className="text-xs text-gray-600">AI Thunderbolt Pro v1.0</p>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center gap-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur px-6 py-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Open navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="text-sm font-semibold text-white">AI Thunderbolt Pro</span>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {activeTab === 'dashboard' && <ComingSoon label="Dashboard" />}
            {activeTab === 'voices' && <VoiceManager />}
            {activeTab === 'agents' && <ComingSoon label="AI Agents" />}
            {activeTab === 'calls' && <ComingSoon label="Calls" />}
            {activeTab === 'analytics' && <ComingSoon label="Analytics" />}
            {activeTab === 'settings' && <ComingSoon label="Settings" />}
          </main>
        </div>
      </div>
    </>
  );
}
