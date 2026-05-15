/**
 * Co-Worker 技能系统类型定义
 */

// ── 技能定义 ──

export type SkillCategory =
  | 'document'
  | 'summary'
  | 'engineering'
  | 'data'
  | 'communication'
  | 'creative';

export interface SkillField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'checkbox' | 'radio' | 'path';
  required: boolean;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  options?: { label: string; value: string }[];
}

export interface InputMode {
  id: string;
  name: string;
  description: string;
  fields: SkillField[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  icon: string;
  category: SkillCategory;
  version: string;
  description: string;
  tags?: string[];
  fields?: SkillField[];
  input_modes?: InputMode[];
  workflow?: Record<string, unknown>;
  output_format: 'docx' | 'pptx' | 'xlsx' | 'md' | 'txt' | 'email' | 'multi';
  output_naming?: string;
  output_files?: { name: string; desc: string }[];
  prompt_template?: string;
  inherits_from?: string;
  avg_rating: number;
  usage_count: number;
  changelog: ChangelogEntry[];
}

// ── 分类信息 ──

export const CATEGORY_META: Record<SkillCategory, { label: string; icon: string }> = {
  document:      { label: '文档操作', icon: '📁' },
  summary:       { label: '总结汇报', icon: '📊' },
  engineering:   { label: '研发工程', icon: '🏗️' },
  data:          { label: '数据材料', icon: '📈' },
  communication: { label: '沟通协作', icon: '📧' },
  creative:      { label: '创意输出', icon: '🎨' },
};

// ── 执行状态 ──

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ExecutionStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

export interface SkillExecutionState {
  skillId: string;
  steps: ExecutionStep[];
  currentStep: number;
  previewText: string;
  outputFiles: string[];
  error?: string;
}

// ── 反馈 ──

export interface SkillFeedback {
  id: string;
  skillId: string;
  rating: 'up' | 'down';
  text?: string;
  executionId: string;
  timestamp: number;
  userModifiedOutput?: string;
}

export interface SkillStats {
  version: string;
  totalUses: number;
  upRatings: number;
  downRatings: number;
  avgRating: number;
  evolutionCount: number;
  lastEvolvedAt?: number;
}

// ── 用户输入 ──

export interface SkillFormData {
  [key: string]: string | string[] | File[];
}

// ── 双模 ──

export type AppMode = 'normal' | 'advanced';

export interface AppViewState {
  mode: AppMode;
  view: 'panel' | 'wizard' | 'progress' | 'result';
  activeSkill: SkillDefinition | null;
  formData: SkillFormData;
  execution: SkillExecutionState | null;
}
