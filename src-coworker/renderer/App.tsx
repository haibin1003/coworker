/**
 * App — Co-Worker 应用入口
 *
 * 职责：
 * 1. 检查是否首次启动 → FirstRunGuide
 * 2. 检查用户偏好 → 恢复上次模式
 * 3. 路由：OfficePanel（普通模式）/ ChatView（高级模式）
 * 4. 全局状态提供（SkillStore + FeedbackStore）
 */

import React, { useEffect, useState } from 'react';
import { SkillStoreProvider, useSkillStore } from './store/skillStore';
import { FeedbackStoreProvider } from './store/feedbackStore';
import { OfficePanel } from './components/OfficePanel';
import { TaskWizard } from './components/TaskWizard';
import { ProgressView } from './components/ProgressView';
import { ResultView } from './components/ResultView';
import { ModeSwitcher } from './components/ModeSwitcher';
import { FirstRunGuide } from './components/FirstRunGuide';

// ── 首次启动检测 ──

const FIRST_RUN_KEY = 'coworker:first-run-complete';

function isFirstRun(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) !== 'true';
  } catch {
    return true; // localStorage 不可用时默认展示引导
  }
}

function markFirstRunComplete(): void {
  try {
    localStorage.setItem(FIRST_RUN_KEY, 'true');
  } catch { /* 静默失败 */ }
}

// ── 主内容 ──

const AppContent: React.FC = () => {
  const { state, dispatch } = useSkillStore();
  const { view } = state;

  // 根据当前 view 渲染对应组件
  const renderView = () => {
    switch (view.view) {
      case 'wizard':
        return <TaskWizard />;
      case 'progress':
        return <ProgressView />;
      case 'result':
        return <ResultView />;
      case 'panel':
      default:
        return <OfficePanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <h1 className="text-base font-semibold text-gray-800">Co-Worker</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">v0.1.0</span>
        </div>
        <ModeSwitcher />
      </header>

      {/* 主体 */}
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>

      {/* 底栏 */}
      <footer className="flex items-center justify-between px-6 py-2 bg-white border-t border-gray-100 shrink-0">
        <span className="text-xs text-gray-400">
          {view.view === 'panel' ? `共 ${state.skills.length} 个技能` : ''}
        </span>
        <span className="text-xs text-gray-400">Co-Worker v0.1.0</span>
      </footer>
    </div>
  );
};

// ── 应用根组件 ──

export const App: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 检查首次启动
    if (isFirstRun()) {
      setShowGuide(true);
    }
    setReady(true);
  }, []);

  const handleGuideComplete = (config: { provider: string; apiKey: string; model: string }) => {
    // 保存配置（通过 IPC 写入 config）
    try {
      const api = (window as any).coworkerAPI;
      if (api?.saveConfig) {
        api.saveConfig(config);
      }
      // 降级：存 localStorage
      localStorage.setItem('coworker:provider', config.provider);
      localStorage.setItem('coworker:model', config.model);
    } catch { /* 静默 */ }

    markFirstRunComplete();
    setShowGuide(false);
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <span className="text-gray-400">加载中...</span>
      </div>
    );
  }

  if (showGuide) {
    return <FirstRunGuide onComplete={handleGuideComplete} />;
  }

  return (
    <SkillStoreProvider>
      <FeedbackStoreProvider>
        <AppContent />
      </FeedbackStoreProvider>
    </SkillStoreProvider>
  );
};

export default App;
