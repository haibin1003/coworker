/**
 * SkillCard — 单个技能卡片
 *
 * 展示在 OfficePanel 中，点击进入技能向导
 */

import React from 'react';
import type { SkillDefinition } from '../types/skill-types';

interface SkillCardProps {
  skill: SkillDefinition;
  onClick: (skill: SkillDefinition) => void;
  variant?: 'default' | 'compact';
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onClick, variant = 'default' }) => {
  const handleClick = () => onClick(skill);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(skill);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-white border border-gray-200
                   hover:border-blue-300 hover:shadow-sm
                   transition-all duration-150 cursor-pointer
                   text-left w-full"
        title={skill.description}
        tabIndex={0}
      >
        <span className="text-xl flex-shrink-0">{skill.icon}</span>
        <span className="text-sm font-medium text-gray-700 truncate">{skill.name}</span>
        {skill.avg_rating > 0 && (
          <span className="ml-auto text-xs text-yellow-500 flex-shrink-0">
            ⭐{skill.avg_rating.toFixed(1)}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex flex-col items-center justify-center gap-3
                 p-5 rounded-xl
                 bg-white border border-gray-200
                 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5
                 active:translate-y-0
                 transition-all duration-200 cursor-pointer
                 min-h-[140px] w-full"
      tabIndex={0}
      title={skill.description}
    >
      <span className="text-3xl leading-none">{skill.icon}</span>
      <span className="text-sm font-semibold text-gray-800">{skill.name}</span>
      <span className="text-xs text-gray-400 text-center line-clamp-2 leading-relaxed">
        {skill.description}
      </span>
      {skill.usage_count > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>已用 {skill.usage_count} 次</span>
          {skill.avg_rating > 0 && <span>⭐{skill.avg_rating.toFixed(1)}</span>}
        </div>
      )}
    </button>
  );
};

export default SkillCard;
