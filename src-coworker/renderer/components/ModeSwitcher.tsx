/**
 * ModeSwitcher — 普通模式 ↔ 高级模式切换
 */

import React from 'react';
import { useSkillStore } from '../store/skillStore';

export const ModeSwitcher: React.FC = () => {
  const { state, dispatch } = useSkillStore();
  const { mode } = state.view;

  const toggle = () => {
    dispatch({ type: 'SET_MODE', mode: mode === 'normal' ? 'advanced' : 'normal' });
  };

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => mode === 'advanced' && toggle()}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
          ${mode === 'normal'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
      >
        🏠 普通模式
      </button>
      <button
        type="button"
        onClick={() => mode === 'normal' && toggle()}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
          ${mode === 'advanced'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }`}
      >
        ⚡ 高级模式
      </button>
    </div>
  );
};

export default ModeSwitcher;
