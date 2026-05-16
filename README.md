# Co-Worker

> **你的数字协同工作者** — 把 AI 编程 Agent 包装成普通人点按钮就能用的办公工具。

Fork from [Open Cowork](https://github.com/OpenCoworkAI/open-cowork) (MIT)，在它之上叠加办公场景层。

---

## 🚀 快速开始 (Windows)

### 1. 克隆项目
```bash
git clone git@github.com:haibin1003/coworker.git
cd coworker
```

### 2. 一键配置
在项目根目录右键 → "使用 PowerShell 运行" → 选择 `setup.ps1`

或者命令行：
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

脚本会自动：
- 检查 Node.js
- 下载 Open Cowork 基座
- 合并 Co-Worker 代码
- 安装依赖
- 启动应用

### 3. 手动步骤（如果脚本失败）
```bash
# 下载基座
git clone --depth 1 https://github.com/OpenCoworkAI/open-cowork.git open-cowork

# 合并代码（手动复制）
# src-coworker/renderer/ → open-cowork/src/renderer/coworker/
# skills/               → open-cowork/coworker-skills/

# 安装依赖 & 启动
cd open-cowork
npm install
npm run dev
```

---

## ✅ 验证

```bash
# 功能测试 (216 项)
node src-coworker/verify.js

# 类型检查
npx tsc --noEmit
```

---

## 📦 打包

```bash
npm run build
# 输出在 release/ 目录
```

---

## 🛠 技术架构

```
Co-Worker (Fork from Open Cowork)

Renderer 层 (React)          ← 我们改动
  OfficePanel       任务卡片网格
  TaskWizard        引导表单 + 专利三种输入
  ProgressView      流式进度
  ResultView        结果展示 + 反馈
  ModeSwitcher      普通↔高级切换
  FirstRunGuide     首次引导

Main 层 (Electron)           ← 完全复用
  agent-runner      AI 执行引擎
  sandbox           沙箱
  mcp               MCP 工具
  skills            技能底层
```

---

## 📋 MVP 技能 (6个)

| 技能 | 简介 |
|------|------|
| 📅 写周报 | 工作内容→结构化周报 |
| 📝 写文档 | 主题大纲→完整文档 |
| 📊 做PPT | 内容大纲→精美PPT |
| 📜 写专利 | 三种输入→专利交底书(招牌) |
| 🔍 审文档 | 上传→逐段分析+修改建议 |
| 📧 写邮件 | 要点→格式规范邮件 |

### 专利技能 (招牌)
三种输入模式：💡天马行空 / 📁给文档 / 💻给代码 → 专利网初筛 → 8步标准流程 → 三份文档

---

## 📄 许可

MIT License (继承自 Open Cowork)
