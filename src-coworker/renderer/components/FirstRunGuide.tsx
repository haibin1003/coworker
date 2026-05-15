/**
 * FirstRunGuide — 首次启动引导
 *
 * 引导用户：
 * 1. 选择 AI 模型（默认推荐 DeepSeek）
 * 2. 输入 API Key
 * 3. 体验第一个任务
 */

import React, { useState } from 'react';

interface FirstRunGuideProps {
  onComplete: (config: { provider: string; apiKey: string; model: string }) => void;
}

const PRESET_MODELS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🐋',
    desc: '推荐 · 性价比最高 · 中文能力强',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    desc: '多模型聚合 · 灵活切换',
    defaultModel: 'anthropic/claude-sonnet-4',
    baseUrl: 'https://openrouter.ai/api',
    getKeyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🏢',
    desc: 'Claude 官方 · 性能最强',
    defaultModel: 'claude-sonnet-4-20250514',
    baseUrl: '',
    getKeyUrl: 'https://console.anthropic.com/keys',
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '⚙️',
    desc: '使用自己的 API 端点',
    defaultModel: '',
    baseUrl: '',
    getKeyUrl: '',
  },
];

export const FirstRunGuide: React.FC<FirstRunGuideProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-chat');
  const [testing, setTesting] = useState(false);

  const provider = PRESET_MODELS.find((p) => p.id === selectedProvider)!;

  const handleNext = () => {
    if (step === 1 && selectedProvider) {
      setModel(provider.defaultModel);
      setStep(2);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    // TODO: 通过 IPC 测试连接
    setTimeout(() => {
      setTesting(false);
      setStep(3);
    }, 1500);
  };

  const handleFinish = () => {
    onComplete({ provider: selectedProvider, apiKey, model });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md mx-auto p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎使用 Co-Worker</h1>
          <p className="text-sm text-gray-500">你的数字协同工作者</p>
        </div>

        {/* 进度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: 选模型 */}
          {step === 1 && (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-4">选择 AI 模型</h2>
              <div className="flex flex-col gap-2">
                {PRESET_MODELS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedProvider(pm.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${selectedProvider === pm.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-2xl">{pm.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700">{pm.name}</div>
                      <div className="text-xs text-gray-500">{pm.desc}</div>
                    </div>
                    {selectedProvider === pm.id && (
                      <span className="text-blue-500 text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="w-full mt-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium
                           hover:bg-blue-600 transition-colors text-sm"
              >
                下一步
              </button>
            </>
          )}

          {/* Step 2: 输入 Key */}
          {step === 2 && (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-2">配置 API Key</h2>
              <p className="text-sm text-gray-500 mb-4">
                使用 {provider.name} 需要 API Key。没有的话去{' '}
                <a
                  href={provider.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  这里获取
                </a>
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="粘贴你的 API Key..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
              />
              {selectedProvider === 'custom' && (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="模型名称"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm mt-3
                             focus:outline-none focus:border-blue-300"
                />
              )}
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600
                             hover:bg-gray-50 transition-colors"
                >
                  ← 返回
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={!apiKey.trim() || testing}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium
                             hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {testing ? '⏳ 测试中...' : '🔗 测试连接'}
                </button>
              </div>
            </>
          )}

          {/* Step 3: 开始 */}
          {step === 3 && (
            <>
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">配置完成！</h2>
                <p className="text-sm text-gray-500 mb-6">
                  正在使用 {provider.name} · {model}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 mb-5">
                  <p className="font-medium mb-1">💡 快速体验</p>
                  <p>打开 Co-Worker，点击 📅 写周报</p>
                  <p>填几个关键信息，AI 帮你完成剩下的</p>
                </div>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold
                             hover:bg-blue-600 transition-colors"
                >
                  🚀 开始使用
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Co-Worker v0.1.0 · MIT License · 你的数据保存在本地
        </p>
      </div>
    </div>
  );
};

export default FirstRunGuide;
