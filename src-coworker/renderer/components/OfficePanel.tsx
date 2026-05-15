/**
 * OfficePanel — Co-Worker 普通模式首页
 *
 * 展示：
 * - 分类侧边导航
 * - 技能卡片网格（按分类分组）
 * - 搜索框
 * - 最近使用
 * - 模式切换入口
 */

import React, { useState, useMemo } from 'react';
import { useSkillStore, useSelectSkill } from '../store/skillStore';
import { SkillCard } from './SkillCard';
import type { SkillCategory } from '../types/skill-types';

export const OfficePanel: React.FC = () => {
  const { state, filteredSkills, recentSkills, groupedSkills, categoryMeta, dispatch } = useSkillStore();
  const selectSkill = useSelectSkill();
  const [searchFocused, setSearchFocused] = useState(false);

  // 当前分类下的技能
  const currentSkills = useMemo(() => {
    if (state.searchQuery) return filteredSkills;
    return filteredSkills;
  }, [filteredSkills, state.searchQuery]);

  // 所有分类
  const allCategories = useMemo(() => {
    const cats = Object.keys(groupedSkills) as SkillCategory[];
    return cats.filter((c) => groupedSkills[c]?.length > 0);
  }, [groupedSkills]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH', query: e.target.value });
  };

  const handleCategoryClick = (cat: SkillCategory | null) => {
    dispatch({ type: 'SET_CATEGORY', category: cat });
  };

  const handleSwitchMode = () => {
    dispatch({ type: 'SET_MODE', mode: 'advanced' });
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* ── 左侧分类导航 ── */}
      <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-white p-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleCategoryClick(null)}
          className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${state.activeCategory === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          📋 全部技能
        </button>

        <div className="h-px bg-gray-100 my-1" />

        {allCategories.map((cat) => {
          const meta = categoryMeta[cat];
          const count = groupedSkills[cat]?.length ?? 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors
                ${state.activeCategory === cat
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span className="mr-1.5">{meta.icon}</span>
              {meta.label}
              <span className="ml-auto text-xs text-gray-400 float-right mt-0.5">{count}</span>
            </button>
          );
        })}

        <div className="mt-auto pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSwitchMode}
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-500
                       hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="切换到高级模式（完整 Claude Code GUI）"
          >
            ⚡ 高级模式
          </button>
        </div>
      </aside>

      {/* ── 右侧主内容区 ── */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* 搜索框 */}
        <div className="mb-6">
          <div className={`relative max-w-md transition-all ${searchFocused ? 'ring-2 ring-blue-200 rounded-lg' : ''}`}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={state.searchQuery}
              onChange={handleSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="搜索技能..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200
                         bg-white text-sm placeholder-gray-400
                         focus:outline-none focus:border-blue-300 transition-colors"
            />
          </div>
        </div>

        {/* 当前分类标题 */}
        {state.activeCategory && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryMeta[state.activeCategory].icon}</span>
              <h2 className="text-lg font-semibold text-gray-800">
                {categoryMeta[state.activeCategory].label}
              </h2>
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className="text-xs text-blue-500 hover:text-blue-700 ml-2"
              >
                查看全部 →
              </button>
            </div>
          </div>
        )}

        {/* 技能卡片网格 — 按分类分组 */}
        {state.activeCategory ? (
          /* 单分类视图 */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onClick={selectSkill} />
            ))}
          </div>
        ) : (
          /* 全部分类视图 */
          <div className="flex flex-col gap-8">
            {allCategories.map((cat) => {
              const skills = groupedSkills[cat] ?? [];
              if (skills.length === 0) return null;
              const meta = categoryMeta[cat];
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{meta.icon}</span>
                    <h3 className="text-base font-semibold text-gray-700">{meta.label}</h3>
                    <span className="text-xs text-gray-400">({skills.length})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {skills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} onClick={selectSkill} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* 最近使用 */}
            {recentSkills.length > 0 && !state.searchQuery && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🕐</span>
                  <h3 className="text-base font-semibold text-gray-700">最近使用</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentSkills.map((skill) => (
                    <SkillCard key={`recent-${skill.id}`} skill={skill} onClick={selectSkill} />
                  ))}
                </div>
              </section>
            )}

            {/* 搜索无结果 */}
            {state.searchQuery && currentSkills.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <span className="text-4xl block mb-3">🔍</span>
                <p>没有找到匹配「{state.searchQuery}」的技能</p>
                <p className="text-sm mt-1">换个关键词试试？</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default OfficePanel;
