/**
 * ResultView — 结果展示 & 反馈收集
 */

import React, { useState } from 'react';
import { useSkillStore } from '../store/skillStore';
import { useFeedback } from '../store/feedbackStore';

export const ResultView: React.FC = () => {
  const { state, dispatch } = useSkillStore();
  const { submitFeedback } = useFeedback();
  const { execution, activeSkill } = state.view;

  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  if (!execution || !activeSkill) return null;

  const handleOpenFile = (filePath: string) => {
    // 通过 Electron shell 打开文件
    try {
      (window as any).electronAPI?.openFile?.(filePath);
    } catch {
      console.log('Open file:', filePath);
    }
  };

  const handleRating = (r: 'up' | 'down') => {
    setRating(r);
    submitFeedback(activeSkill.id, r, feedbackText || undefined);
  };

  const handleBack = () => {
    dispatch({ type: 'GO_PANEL' });
  };

  const handleRedo = () => {
    dispatch({ type: 'GO_WIZARD' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
        <span className="text-2xl">{activeSkill.icon}</span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-800">{activeSkill.name} — 已完成</h2>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          返回首页
        </button>
      </header>

      {/* 主体 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          {/* 成功图标 */}
          <div className="text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-gray-800">生成完成！</h3>
          </div>

          {/* 输出文件列表 */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">生成的文件</h4>
            <div className="flex flex-col gap-2">
              {execution.outputFiles.length > 0 ? (
                execution.outputFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg
                               hover:border-blue-300 transition-colors"
                  >
                    <span className="text-xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{file}</p>
                      <p className="text-xs text-gray-400">DOCX 文档</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenFile(file)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg
                                 hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                      📂 打开
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
                  文件生成中，请稍候...
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRedo}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 bg-white
                         text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              🔄 重新生成
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white
                         text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              🏠 回到首页
            </button>
          </div>

          {/* 评分反馈 */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">这个结果怎么样？</h4>

            {rating === null ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRating('up')}
                  className="flex-1 py-3 rounded-lg border-2 border-gray-200
                             hover:border-green-300 hover:bg-green-50
                             text-2xl transition-all"
                >
                  👍
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('down')}
                  className="flex-1 py-3 rounded-lg border-2 border-gray-200
                             hover:border-red-300 hover:bg-red-50
                             text-2xl transition-all"
                >
                  👎
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded-lg text-center text-sm font-medium
                ${rating === 'up' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}
              `}>
                {rating === 'up' ? '👍 感谢你的认可！' : '👎 感谢反馈，我们会改进！'}
              </div>
            )}

            {/* 文字反馈 */}
            {rating === 'down' && (
              <div className="mt-3">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="说说哪里需要改进..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             placeholder-gray-400 focus:outline-none focus:border-blue-300 resize-y"
                />
                <button
                  type="button"
                  onClick={() => submitFeedback(activeSkill.id, 'down', feedbackText)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg
                             hover:bg-blue-600 transition-colors"
                >
                  提交反馈
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
