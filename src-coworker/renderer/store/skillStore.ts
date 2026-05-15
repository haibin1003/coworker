/**
 * skillStore — 技能注册、分类、搜索、最近使用
 *
 * 职责：
 * - 加载内建技能（从 skills/*/skill.json 编译时注入）
 * - 按分类分组
 * - 搜索 & 筛选
 * - 最近使用追踪（存 localStorage）
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { SkillDefinition, SkillCategory, SkillFormData, AppViewState, SkillExecutionState } from '../types/skill-types';
import { CATEGORY_META } from '../types/skill-types';

// ── 内建技能注册表（编译时或运行时注入）──

const BUILTIN_SKILLS: SkillDefinition[] = [
  // 这些在构建时由脚本从 skills/*/skill.json 自动生成
  // 此处为静态引用，开发阶段直接 import
];

// ── State ──

interface SkillStoreState {
  skills: SkillDefinition[];
  categories: SkillCategory[];
  searchQuery: string;
  activeCategory: SkillCategory | null;
  recentIds: string[];
  view: AppViewState;
}

const initialState: SkillStoreState = {
  skills: [],
  categories: [],
  searchQuery: '',
  activeCategory: null,
  recentIds: [],
  view: {
    mode: 'normal',
    view: 'panel',
    activeSkill: null,
    formData: {},
    execution: null,
  },
};

// ── Actions ──

type Action =
  | { type: 'LOAD_SKILLS'; skills: SkillDefinition[] }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_CATEGORY'; category: SkillCategory | null }
  | { type: 'SELECT_SKILL'; skill: SkillDefinition }
  | { type: 'SET_FORM_DATA'; data: SkillFormData }
  | { type: 'START_EXECUTION'; execution: SkillExecutionState }
  | { type: 'UPDATE_EXECUTION'; execution: Partial<SkillExecutionState> }
  | { type: 'FINISH_EXECUTION'; files: string[] }
  | { type: 'GO_PANEL' }
  | { type: 'GO_WIZARD' }
  | { type: 'GO_PROGRESS' }
  | { type: 'GO_RESULT' }
  | { type: 'SET_MODE'; mode: 'normal' | 'advanced' }
  | { type: 'RECORD_USE'; skillId: string };

function reducer(state: SkillStoreState, action: Action): SkillStoreState {
  switch (action.type) {
    case 'LOAD_SKILLS': {
      const cats = [...new Set(action.skills.map((s) => s.category))];
      return { ...state, skills: action.skills, categories: cats };
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.category };
    case 'SELECT_SKILL':
      return {
        ...state,
        view: { ...state.view, activeSkill: action.skill, view: 'wizard', formData: {} },
      };
    case 'SET_FORM_DATA':
      return { ...state, view: { ...state.view, formData: action.data } };
    case 'START_EXECUTION':
      return { ...state, view: { ...state.view, view: 'progress', execution: action.execution } };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        view: {
          ...state.view,
          execution: state.view.execution
            ? { ...state.view.execution, ...action.execution }
            : null,
        },
      };
    case 'FINISH_EXECUTION':
      return {
        ...state,
        view: {
          ...state.view,
          view: 'result',
          execution: state.view.execution
            ? { ...state.view.execution, outputFiles: action.files }
            : null,
        },
      };
    case 'GO_PANEL':
      return { ...state, view: { ...state.view, view: 'panel', activeSkill: null, formData: {}, execution: null } };
    case 'GO_WIZARD':
      return { ...state, view: { ...state.view, view: 'wizard' } };
    case 'GO_PROGRESS':
      return { ...state, view: { ...state.view, view: 'progress' } };
    case 'GO_RESULT':
      return { ...state, view: { ...state.view, view: 'result' } };
    case 'SET_MODE':
      return { ...state, view: { ...state.view, mode: action.mode } };
    case 'RECORD_USE': {
      const filtered = state.recentIds.filter((id) => id !== action.skillId);
      const updated = [action.skillId, ...filtered].slice(0, 10);
      return { ...state, recentIds: updated };
    }
    default:
      return state;
  }
}

// ── Context ──

interface SkillStoreContextValue {
  state: SkillStoreState;
  dispatch: React.Dispatch<Action>;
  // 便利方法
  filteredSkills: SkillDefinition[];
  recentSkills: SkillDefinition[];
  groupedSkills: Record<SkillCategory, SkillDefinition[]>;
  categoryMeta: typeof CATEGORY_META;
}

const SkillStoreContext = createContext<SkillStoreContextValue | null>(null);

export function SkillStoreProvider({ children, skills = BUILTIN_SKILLS }: { children: React.ReactNode; skills?: SkillDefinition[] }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 加载技能
  useEffect(() => {
    if (skills.length > 0) {
      dispatch({ type: 'LOAD_SKILLS', skills });
    }
  }, [skills]);

  // 从 localStorage 恢复最近使用
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coworker-recent-skills');
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        ids.forEach((id) => dispatch({ type: 'RECORD_USE', skillId: id }));
      }
    } catch { /* ignore */ }
  }, []);

  // ── 派生数据 ──

  const filteredSkills = state.skills.filter((s) => {
    if (state.activeCategory && s.category !== state.activeCategory) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchTag = s.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  const recentSkills = state.recentIds
    .map((id) => state.skills.find((s) => s.id === id))
    .filter(Boolean) as SkillDefinition[];

  const groupedSkills = {} as Record<SkillCategory, SkillDefinition[]>;
  for (const s of state.skills) {
    if (!groupedSkills[s.category]) groupedSkills[s.category] = [];
    groupedSkills[s.category].push(s);
  }

  const value: SkillStoreContextValue = {
    state,
    dispatch,
    filteredSkills,
    recentSkills,
    groupedSkills,
    categoryMeta: CATEGORY_META,
  };

  return <SkillStoreContext.Provider value={value}>{children}</SkillStoreContext.Provider>;
}

export function useSkillStore() {
  const ctx = useContext(SkillStoreContext);
  if (!ctx) throw new Error('useSkillStore must be used within SkillStoreProvider');
  return ctx;
}

/**
 * 便捷 hook：选中技能并跳转向导
 */
export function useSelectSkill() {
  const { dispatch } = useSkillStore();
  return useCallback(
    (skill: SkillDefinition) => {
      dispatch({ type: 'RECORD_USE', skillId: skill.id });
      dispatch({ type: 'SELECT_SKILL', skill });
    },
    [dispatch],
  );
}
