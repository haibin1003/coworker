/**
 * Co-Worker 技能系统类型定义
 * 这些是我们要新增到 Open Cowork renderer 层的核心类型
 */

// ── 技能定义 ──

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

export interface OutputFile {
  name: string;
  desc: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  icon: string;
  category: 'document' | 'summary' | 'engineering' | 'data' | 'communication' | 'creative';
  version: string;
  description: string;
  tags?: string[];
  fields?: SkillField[];
  input_modes?: InputMode[];
  workflow?: Record<string, unknown>;
  output_format: 'docx' | 'pptx' | 'xlsx' | 'md' | 'txt' | 'email' | 'multi';
  output_naming?: string;
  output_files?: OutputFile[];
  prompt_template?: string;
  inherits_from?: string;
  avg_rating: number;
  usage_count: number;
  changelog: ChangelogEntry[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// ── 技能执行状态 ──

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

// ── 反馈系统 ──

export interface SkillFeedback {
  id: string;
  skillId: string;
  rating: 'up' | 'down';
  text?: string;
  executionId: string;
  timestamp: number;
  userModifiedOutput?: string; // 用户修改后的版本路径
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

// ── 双模交互 ──

export type AppMode = 'normal' | 'advanced';

export interface AppState {
  mode: AppMode;
  activeSkillId: string | null;
  showWizard: boolean;
  showProgress: boolean;
  showResult: boolean;
}
