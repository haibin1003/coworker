/**
 * ProgressView — 流式进度展示
 *
 * 把 Claude Code 的终端输出翻译成用户友好的步骤进度
 */

import React from 'react';
import { useSkillStore } from '../store/skillStore';

const STATUS_ICONS: Record<string, string> = {
  pending: '⏸',
  running: '⏳',
  completed: '✅',
  failed: '❌',
};

export const ProgressView: React.FC = () => {
  const { state, dispatch } = useSkillStore();
  const { execution, activeSkill } = state.view;

  if (!execution || !activeSkill) return null;

  const handleCancel = () => {
    dispatch({ type: 'GO_PANEL' });
  };

  const isFinished = execution.steps.every((s) => s.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
        <span className="text-2xl">{activeSkill.icon}</span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-800">
            {isFinished ? `${activeSkill.name} — 完成！` : `正在${activeSkill.name}`}
          </h2>
        </div>
        {!isFinished && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            取消
          </button>
        )}
      </header>

      {/* 进度步骤 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex flex-col gap-1">
            {execution.steps.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${step.status === 'running' ? 'bg-blue-50 border border-blue-200' : ''}
                  ${step.status === 'failed' ? 'bg-red-50 border border-red-200' : ''}
                  ${step.status === 'completed' ? 'opacity-70' : ''}
                `}
              >
                <span className="text-lg flex-shrink-0">
                  {STATUS_ICONS[step.status] ?? '⏸'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium
                    ${step.status === 'running' ? 'text-blue-700' : ''}
                    ${step.status === 'failed' ? 'text-red-600' : ''}
                    ${step.status === 'completed' ? 'text-gray-600' : 'text-gray-700'}
                  `}>
                    {step.label}
                  </span>
                  {step.detail && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{step.detail}</p>
                  )}
                </div>
                {step.status === 'running' && (
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 预览文本 */}
          {execution.previewText && (
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">实时预览</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {execution.previewText}
              </pre>
            </div>
          )}

          {/* 错误 */}
          {execution.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-700 mb-1">执行出错</h4>
              <p className="text-sm text-red-600">{execution.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
