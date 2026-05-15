/**
 * feedbackStore — 用户反馈收集与技能进化触发
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SkillFeedback, SkillDefinition } from '../types/skill-types';

interface FeedbackStoreState {
  feedbacks: SkillFeedback[];
  evolutionEligible: string[]; // 满足进化条件的 skillId
}

interface FeedbackContextValue {
  state: FeedbackStoreState;
  submitFeedback: (skillId: string, rating: 'up' | 'down', text?: string) => void;
  triggerEvolution: (skillId: string) => Promise<SkillDefinition | null>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedbackStoreState>({ feedbacks: [], evolutionEligible: [] });

  const submitFeedback = useCallback((skillId: string, rating: 'up' | 'down', text?: string) => {
    const feedback: SkillFeedback = {
      id: `${skillId}_${Date.now()}`,
      skillId,
      rating,
      text,
      executionId: '',
      timestamp: Date.now(),
    };

    setState((prev) => {
      const feedbacks = [...prev.feedbacks, feedback];
      // 检查进化条件：累计 10 条反馈 或 连续 3 条负面
      const skillFeedbacks = feedbacks.filter((f) => f.skillId === skillId);
      const recentDowns = skillFeedbacks.slice(-3).filter((f) => f.rating === 'down');

      let evolutionEligible = [...prev.evolutionEligible];
      if (
        skillFeedbacks.length >= 10 ||
        (recentDowns.length >= 3 && skillFeedbacks.length >= 3)
      ) {
        if (!evolutionEligible.includes(skillId)) {
          evolutionEligible.push(skillId);
        }
      }

      // 持久化
      try {
        localStorage.setItem('coworker-feedbacks', JSON.stringify(feedbacks));
      } catch { /* ignore */ }

      return { feedbacks, evolutionEligible };
    });
  }, []);

  const triggerEvolution = useCallback(async (skillId: string): Promise<SkillDefinition | null> => {
    // TODO: Week 2 — 调 AI 分析反馈 → 生成新版本 → A/B 测试
    // MVP 阶段先标记已触发
    setState((prev) => ({
      ...prev,
      evolutionEligible: prev.evolutionEligible.filter((id) => id !== skillId),
    }));
    return null;
  }, []);

  return (
    <FeedbackContext.Provider value={{ state, submitFeedback, triggerEvolution }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackStoreProvider');
  return ctx;
}
