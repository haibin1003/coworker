/**
 * agent-bridge — IPC 通信类型定义
 *
 * 定义 Co-Worker 办公场景技能与 Open Cowork agent-runner 之间的通信协议
 */

// ── 执行请求（Renderer → Main）──

export interface SkillExecuteRequest {
  /** 技能 ID */
  skillId: string;
  /** 技能名称 */
  skillName: string;
  /** 组装好的完整 prompt */
  prompt: string;
  /** 用户上传的文件路径列表 */
  attachedFiles?: string[];
  /** 输出格式 */
  outputFormat: 'docx' | 'pptx' | 'xlsx' | 'md' | 'txt' | 'email' | 'multi';
  /** 输出文件命名模板 */
  outputNaming?: string;
  /** 工作区目录 */
  workspaceDir: string;
  /** 透传选项 */
  options?: {
    /** MCP 工具开关 */
    mcp?: { webSearch?: boolean; notion?: boolean };
    /** 是否注入用户记忆偏好 */
    useMemory?: boolean;
    /** GUI 自动化开关 */
    useGui?: boolean;
  };
}

// ── 流式事件（Main → Renderer）──

export type ExecuteEvent =
  | { type: 'step_start'; stepId: string; label: string }
  | { type: 'step_progress'; stepId: string; detail: string }
  | { type: 'step_complete'; stepId: string }
  | { type: 'step_fail'; stepId: string; error: string }
  | { type: 'preview'; text: string }
  | { type: 'tool_use'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; summary: string }
  | { type: 'file_created'; path: string; format: string }
  | { type: 'complete'; files: string[]; durationMs: number }
  | { type: 'error'; message: string; stepId?: string };

// ── IPC 通道定义 ──

export const IPC_CHANNELS = {
  /** 执行技能 */
  EXECUTE_SKILL: 'coworker:execute-skill',
  /** 执行流式事件 */
  EXECUTE_EVENT: 'coworker:execute-event',
  /** 取消执行 */
  CANCEL_EXECUTE: 'coworker:cancel-execute',
  /** 打开文件 */
  OPEN_FILE: 'coworker:open-file',
  /** 选择目录 */
  SELECT_DIRECTORY: 'coworker:select-directory',
  /** 测试 API Key */
  TEST_API_KEY: 'coworker:test-api-key',
  /** 获取工作区 */
  GET_WORKSPACE: 'coworker:get-workspace',
} as const;

// ── Electron API 声明（扩展 Window）──

declare global {
  interface Window {
    coworkerAPI?: {
      executeSkill: (req: SkillExecuteRequest) => Promise<{ executionId: string }>;
      cancelExecution: (executionId: string) => Promise<void>;
      onExecuteEvent: (callback: (event: ExecuteEvent) => void) => () => void;
      openFile: (path: string) => Promise<void>;
      selectDirectory: () => Promise<string | null>;
      testApiKey: (provider: string, key: string, model: string) => Promise<{ ok: boolean; latencyMs: number; error?: string }>;
      getWorkspace: () => Promise<string>;
    };
  }
}
