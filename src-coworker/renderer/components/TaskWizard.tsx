/**
 * TaskWizard — 技能引导表单
 *
 * 职责：
 * - 根据 skill.json 的 fields / input_modes 动态渲染表单
 * - 支持文件拖拽上传
 * - 组装 prompt → 通过 IPC 调用 agent-runner
 * - 提交后 → 切换到 ProgressView
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSkillStore } from '../store/skillStore';
import type { SkillField, SkillFormData } from '../types/skill-types';

// ── 字段渲染器 ──

interface FieldRendererProps {
  field: SkillField;
  value: string | string[] | File[];
  onChange: (key: string, value: string | string[] | File[]) => void;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange }) => {
  const stringValue = Array.isArray(value) ? (typeof value[0] === 'string' ? value[0] : '') : (typeof value === 'string' ? value : '');

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={stringValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                     placeholder-gray-400 focus:outline-none focus:border-blue-300
                     focus:ring-1 focus:ring-blue-200 resize-y min-h-[80px]"
          required={field.required}
        />
      );

    case 'text':
      return (
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                     placeholder-gray-400 focus:outline-none focus:border-blue-300
                     focus:ring-1 focus:ring-blue-200"
          required={field.required}
        />
      );

    case 'select':
      return (
        <select
          value={stringValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                     bg-white focus:outline-none focus:border-blue-300 cursor-pointer"
          required={field.required}
        >
          <option value="">请选择...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'radio':
      return (
        <div className="flex gap-3 flex-wrap">
          {field.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="radio"
                name={field.key}
                value={opt.value}
                checked={stringValue === opt.value}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="accent-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex gap-3 flex-wrap">
          {field.options?.map((opt) => {
            const arr = Array.isArray(value) ? value.map(String) : [];
            return (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={arr.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...arr, opt.value]
                      : arr.filter((v) => v !== opt.value);
                    onChange(field.key, next);
                  }}
                  className="accent-blue-500"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      );

    case 'file': {
      const files = Array.isArray(value) ? value.filter((f): f is File => f instanceof File) : [];
      return (
        <DropZone
          files={files}
          accept={field.accept}
          multiple={field.multiple}
          onChange={(newFiles) => onChange(field.key, newFiles)}
        />
      );
    }

    case 'path':
      return (
        <div className="flex gap-2">
          <input
            type="text"
            value={stringValue}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || '选择项目目录...'}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                       placeholder-gray-400 focus:outline-none focus:border-blue-300"
            required={field.required}
          />
          <button
            type="button"
            onClick={async () => {
              // 通过 Electron dialog 选择目录
              try {
                const result = await (window as any).electronAPI?.selectDirectory();
                if (result) onChange(field.key, result);
              } catch { /* 非 Electron 环境 */ }
            }}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg
                       text-gray-600 transition-colors flex-shrink-0"
          >
            📂 浏览
          </button>
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      );
  }
};

// ── 文件拖拽区 ──

interface DropZoneProps {
  files: File[];
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ files, accept, multiple, onChange }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      onChange(multiple ? [...files, ...droppedFiles] : droppedFiles);
    },
    [files, multiple, onChange],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      onChange(multiple ? [...files, ...selected] : selected);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
      onClick={() => document.getElementById(`file-input-${accept}`)?.click()}
    >
      <input
        id={`file-input-${accept}`}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2 justify-center">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              📄 {f.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(files.filter((_, j) => j !== i));
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          <span className="text-2xl block mb-1">📎</span>
          拖拽文件到此处，或点击选择
        </div>
      )}
    </div>
  );
};

// ── 主组件 ──

export const TaskWizard: React.FC = () => {
  const { state, dispatch } = useSkillStore();
  const { activeSkill, formData } = state.view;
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 确定当前使用的字段列表
  const currentFields = useMemo<SkillField[]>(() => {
    if (!activeSkill) return [];

    // 如果有多输入模式且已选择
    if (activeSkill.input_modes && activeMode) {
      const mode = activeSkill.input_modes.find((m) => m.id === activeMode);
      return mode?.fields ?? [];
    }

    return activeSkill.fields ?? [];
  }, [activeSkill, activeMode]);

  const handleFieldChange = useCallback(
    (key: string, value: string | string[] | File[]) => {
      dispatch({ type: 'SET_FORM_DATA', data: { ...formData, [key]: value } });
    },
    [dispatch, formData],
  );

  const handleSubmit = async () => {
    if (!activeSkill) return;

    // 校验必填字段
    const missing = currentFields.filter((f) => {
      const val = formData[f.key];
      return f.required && (!val || (Array.isArray(val) && val.length === 0));
    });
    if (missing.length > 0) {
      alert(`请填写：${missing.map((f) => f.label).join('、')}`);
      return;
    }

    setSubmitting(true);

    // 组装 prompt
    let prompt = activeSkill.prompt_template ?? '';
    for (const [key, value] of Object.entries(formData)) {
      const displayValue = Array.isArray(value)
        ? value.map((v) => (v instanceof File ? `[文件: ${v.name}]` : String(v))).join('\n')
        : String(value);
      prompt = prompt.replace(`{${key}}`, displayValue);
    }

    // 记录使用
    dispatch({ type: 'RECORD_USE', skillId: activeSkill.id });

    // 启动执行 → 切换到 ProgressView
    dispatch({
      type: 'START_EXECUTION',
      execution: {
        skillId: activeSkill.id,
        steps: [
          { id: 'init', label: '初始化', status: 'running' },
          { id: 'analyze', label: '分析输入内容', status: 'pending' },
          { id: 'generate', label: '生成文档', status: 'pending' },
          { id: 'format', label: '格式化排版', status: 'pending' },
        ],
        currentStep: 0,
        previewText: '',
        outputFiles: [],
      },
    });

    // 异步执行 — 通过 IPC 调 agent-runner
    // 在 Open Cowork 中，这通过 config-store 的 IPC 通道完成
    try {
      // TODO: Week 2 — 接真实的 agent-runner IPC
      // const result = await window.electronAPI.executeSkill({
      //   skillId: activeSkill.id,
      //   prompt,
      //   outputFormat: activeSkill.output_format,
      //   outputNaming: activeSkill.output_naming,
      // });
      // dispatch({ type: 'FINISH_EXECUTION', files: result.files });

      // MVP 占位：模拟步骤推进
      setTimeout(() => {
        dispatch({ type: 'UPDATE_EXECUTION', execution: { currentStep: 1, steps: [
          { id: 'init', label: '初始化', status: 'completed', detail: '环境就绪' },
          { id: 'analyze', label: '分析输入内容', status: 'running' },
          { id: 'generate', label: '生成文档', status: 'pending' },
          { id: 'format', label: '格式化排版', status: 'pending' },
        ]}});
      }, 800);
    } catch (err) {
      dispatch({
        type: 'UPDATE_EXECUTION',
        execution: { error: err instanceof Error ? err.message : '执行失败' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    dispatch({ type: 'GO_PANEL' });
  };

  if (!activeSkill) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── 顶栏 ── */}
      <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <button
          type="button"
          onClick={handleBack}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ←
        </button>
        <span className="text-2xl">{activeSkill.icon}</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{activeSkill.name}</h2>
          <p className="text-sm text-gray-500">{activeSkill.description}</p>
        </div>
      </header>

      {/* ── 表单内容 ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* 多输入模式选择（如：专利技能） */}
          {activeSkill.input_modes && activeSkill.input_modes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请选择输入方式
              </label>
              <div className="grid grid-cols-3 gap-3">
                {activeSkill.input_modes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setActiveMode(mode.id);
                      dispatch({ type: 'SET_FORM_DATA', data: {} }); // 清空表单
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${activeMode === mode.id
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="text-lg font-semibold mb-1">{mode.name}</div>
                    <div className="text-xs text-gray-500">{mode.description}</div>
                  </button>
                ))}
              </div>
              {activeMode && (
                <div className="mt-2 text-xs text-blue-600">
                  已选择输入方式，请继续填写下方表单
                </div>
              )}
            </div>
          )}

          {/* 动态字段 */}
          {currentFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <FieldRenderer
                field={field}
                value={formData[field.key] ?? ''}
                onChange={handleFieldChange}
              />
            </div>
          ))}

          {/* 提交按钮 */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || currentFields.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-white
                         bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors text-base shadow-sm"
            >
              {submitting ? '⏳ 准备中...' : `⚡ 生成${activeSkill.name.replace('写', '').replace('做', '')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskWizard;
