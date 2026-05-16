/**
 * skill-executor — 技能执行引擎
 *
 * 职责：
 * 1. 加载 prompt 模板（从 skills/{id}/prompts/）
 * 2. 填入用户表单数据
 * 3. 通过 IPC 调用 agent-runner
 * 4. 流式事件 → ProgressView 更新
 * 5. 完成 → ResultView
 */

import type { SkillDefinition, SkillFormData, ExecutionStep, SkillExecutionState } from '../types/skill-types';
import type { SkillExecuteRequest, ExecuteEvent } from './agent-bridge';
import { IPC_CHANNELS } from './agent-bridge';

// ── Prompt 模板加载 ──

const promptCache = new Map<string, string>();

export async function loadPromptTemplate(skillId: string): Promise<string> {
  if (promptCache.has(skillId)) {
    return promptCache.get(skillId)!;
  }

  // 在构建时，prompt 模板会被打包到应用资源中
  // 开发环境：从 skills/{id}/prompts/default.md 读取
  // 生产环境：从 extraResources 读取

  try {
    // TODO: 根据环境选择加载方式
    // 开发环境用 fetch
    const response = await fetch(`/skills/${skillId}/prompts/default.md`);
    if (response.ok) {
      const text = await response.text();
      promptCache.set(skillId, text);
      return text;
    }
  } catch {
    console.warn(`[SkillExecutor] Cannot load prompt for ${skillId}, using fallback`);
  }

  // 回退：使用 skill.json 中的 prompt_template 字段
  return '';
}

// ── 设计系统内容加载 ──

const designSystemCache = new Map<string, string>();

export async function loadDesignSystemContent(dsId: string): Promise<string> {
  if (!dsId) return '';
  if (designSystemCache.has(dsId)) {
    return designSystemCache.get(dsId)!;
  }

  try {
    const response = await fetch(`/design-systems/${dsId}/DESIGN.md`);
    if (response.ok) {
      const text = await response.text();
      designSystemCache.set(dsId, text);
      return text;
    }
  } catch {
    console.warn(`[SkillExecutor] Cannot load design system: ${dsId}`);
  }

  return '';
}

// ── Prompt 变量替换 ──

export function fillPromptTemplate(
  template: string,
  skill: SkillDefinition,
  formData: SkillFormData,
): string {
  let filled = template;

  // 替换所有 {{key}} 占位符
  for (const [key, value] of Object.entries(formData)) {
    const displayValue = formatFieldValue(value);
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), displayValue);
  }

  // 替换特殊变量
  filled = filled.replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0]);
  filled = filled.replace(/\{\{title\}\}/g, formData.title as string || skill.name);
  filled = filled.replace(/\{\{skill_name\}\}/g, skill.name);

  return filled;
}

function formatFieldValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (v instanceof File) return `[文件: ${v.name}]`;
        return String(v);
      })
      .join('\n');
  }
  return String(value ?? '');
}

// ── 技能执行 ──

export interface ExecutionCallbacks {
  onStepChange: (steps: ExecutionStep[], currentStep: number) => void;
  onPreview: (text: string) => void;
  onFileCreated: (path: string, format: string) => void;
  onComplete: (files: string[]) => void;
  onError: (message: string) => void;
}

export async function executeSkill(
  skill: SkillDefinition,
  formData: SkillFormData,
  workspaceDir: string,
  callbacks: ExecutionCallbacks,
): Promise<void> {
  // 1. 加载并填充 prompt
  const template = await loadPromptTemplate(skill.id);

  // 1a. 注入设计系统内容
  let designSystemContent = '';
  const dsId = formData['design_system'] as string;
  if (dsId && (skill.id === 'ppt-generator' || skill.id === 'doc-writer' || skill.id === 'email-composer')) {
    designSystemContent = await loadDesignSystemContent(dsId);
    formData['design_system_content'] = designSystemContent;
  }

  const prompt = template
    ? fillPromptTemplate(template, skill, formData)
    : buildFallbackPrompt(skill, formData);

  // 2. 构建执行请求
  const request: SkillExecuteRequest = {
    skillId: skill.id,
    skillName: skill.name,
    prompt,
    outputFormat: skill.output_format as SkillExecuteRequest['outputFormat'],
    outputNaming: skill.output_naming,
    workspaceDir,
    attachedFiles: extractFilePaths(formData),
    options: {
      mcp: { webSearch: false, notion: false },
      useMemory: true,
      useGui: skill.id === 'patent' || skill.id === 'ppt-generator',
    },
  };

  // 3. 初始化步骤
  const steps: ExecutionStep[] = buildExecutionSteps(skill);
  callbacks.onStepChange(steps, 0);

  // 4. 通过 IPC 调用 agent-runner
  const api = window.coworkerAPI;
  if (!api) {
    // 非 Electron 环境（开发模式），模拟执行
    await simulateExecution(skill, steps, callbacks);
    return;
  }

  try {
    const { executionId } = await api.executeSkill(request);

    // 5. 监听流式事件
    const unsubscribe = api.onExecuteEvent((event: ExecuteEvent) => {
      handleExecuteEvent(event, steps, callbacks);
    });

    // 6. 等待完成（通过 onComplete 回调处理）
    // 注意：unsubscribe 在组件卸载时调用

  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : '执行失败');
  }
}

// ── 事件处理 ──

function handleExecuteEvent(
  event: ExecuteEvent,
  steps: ExecutionStep[],
  callbacks: ExecutionCallbacks,
): void {
  switch (event.type) {
    case 'step_start': {
      const idx = steps.findIndex((s) => s.id === event.stepId);
      if (idx >= 0) {
        steps[idx].status = 'running';
        steps[idx].detail = event.label;
        callbacks.onStepChange([...steps], idx);
      }
      break;
    }
    case 'step_progress': {
      const idx = steps.findIndex((s) => s.id === event.stepId);
      if (idx >= 0) {
        steps[idx].detail = event.detail;
        callbacks.onStepChange([...steps], idx);
      }
      break;
    }
    case 'step_complete': {
      const idx = steps.findIndex((s) => s.id === event.stepId);
      if (idx >= 0) {
        steps[idx].status = 'completed';
        callbacks.onStepChange([...steps], idx + 1);
      }
      break;
    }
    case 'step_fail': {
      const idx = steps.findIndex((s) => s.id === event.stepId);
      if (idx >= 0) {
        steps[idx].status = 'failed';
        steps[idx].detail = event.error;
        callbacks.onStepChange([...steps], idx);
      }
      callbacks.onError(event.error);
      break;
    }
    case 'preview':
      callbacks.onPreview(event.text);
      break;
    case 'file_created':
      callbacks.onFileCreated(event.path, event.format);
      break;
    case 'complete':
      callbacks.onComplete(event.files);
      break;
    case 'error':
      callbacks.onError(event.message);
      break;
  }
}

// ── 步骤构建 ──

function buildExecutionSteps(skill: SkillDefinition): ExecutionStep[] {
  if (skill.id === 'patent') {
    return [
      { id: 'init', label: '初始化', status: 'running', detail: '' },
      { id: 'analyze', label: '分析技术方案', status: 'pending', detail: '' },
      { id: 'mine', label: '专利点挖掘', status: 'pending', detail: '' },
      { id: 'search', label: '国知局查新', status: 'pending', detail: '' },
      { id: 'preview', label: '摘要预览', status: 'pending', detail: '' },
      { id: 'generate', label: '生成交底书', status: 'pending', detail: '' },
      { id: 'review', label: '自检修订', status: 'pending', detail: '' },
      { id: 'deliver', label: '输出文档', status: 'pending', detail: '' },
    ];
  }

  return [
    { id: 'init', label: '初始化', status: 'running', detail: '' },
    { id: 'analyze', label: '分析输入内容', status: 'pending', detail: '' },
    { id: 'generate', label: '生成文档', status: 'pending', detail: '' },
    { id: 'format', label: '格式化排版', status: 'pending', detail: '' },
  ];
}

// ── 回退 Prompt（没有模板文件时）──

function buildFallbackPrompt(skill: SkillDefinition, formData: SkillFormData): string {
  const parts: string[] = [
    `请帮我${skill.name}。`,
    '',
  ];

  for (const field of skill.fields ?? []) {
    const value = formData[field.key];
    if (value) {
      parts.push(`${field.label}：${formatFieldValue(value)}`);
    }
  }

  parts.push('');
  parts.push(`输出格式：${skill.output_format}`);
  parts.push(`请生成文件并保存到工作区。`);

  return parts.join('\n');
}

function extractFilePaths(formData: SkillFormData): string[] {
  const paths: string[] = [];
  for (const value of Object.values(formData)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) {
          paths.push((item as any).path ?? item.name);
        }
      }
    } else if (typeof value === 'string' && value.startsWith('/')) {
      paths.push(value);
    }
  }
  return paths;
}

// ── 模拟执行（开发模式）──

async function simulateExecution(
  skill: SkillDefinition,
  steps: ExecutionStep[],
  callbacks: ExecutionCallbacks,
): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    steps[i].status = 'running';
    callbacks.onStepChange([...steps], i);

    await sleep(600 + Math.random() * 800);

    steps[i].status = 'completed';
    steps[i].detail = `${steps[i].label}完成`;
    callbacks.onStepChange([...steps], i + 1);

    if (i === 1) {
      callbacks.onPreview('正在根据你的输入生成内容...');
    }
  }

  const outputName = skill.output_naming?.replace('{date}', new Date().toISOString().split('T')[0]).replace('{title}', '未命名') ?? `${skill.name}.${skill.output_format}`;
  callbacks.onComplete([outputName]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
