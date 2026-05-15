/**
 * TaskWizard - 技能引导表单
 * 根据 skill.json 的 fields 定义动态渲染表单
 *
 * 职能：
 * - 读取 skillDefinition.fields 渲染表单
 * - 支持三种输入模式切换（专利技能）
 * - 文件拖拽上传
 * - 组装 prompt → 通过 IPC 调用 agent-runner
 * - 表单提交后 → 显示 ProgressView
 */
import React from 'react';

export default function TaskWizard() {
  return <div>{/* TODO: Week 1 Day 5 实现 */}</div>;
}
