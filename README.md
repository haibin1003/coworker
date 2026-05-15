# Co-Worker

> **你的数字协同工作者** — 把 Claude Code 包装成普通人点按钮就能用的办公工具。

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)]()

---

## 这是什么

Co-Worker 是一个桌面办公应用。你不用学习 prompt，不用知道 AI 是什么——打开应用，点一个按钮，填几个关键信息，AI 帮你完成剩下的。

- 🏢 **面向真实办公场景**，不是聊天工具
- 🎯 **每个场景一个技能按钮**：写周报、做PPT、写专利、审文档、写邮件…
- 🔄 **用了就会变好**：每次使用后的反馈都在训练技能自动进化

## 与 Claude Code / Open Cowork 的关系

```
Claude Code CLI           → 命令行，只有开发者能用
Open Cowork               → GUI 包装，但还是 Chat 界面
Co-Worker                 → 场景化技能面板，普通人 30 秒上手
```

Co-Worker **Fork 自 [Open Cowork](https://github.com/OpenCoworkAI/open-cowork)**，在其基础架构上新增了一套 `OfficePanel` 普通模式。  
只修改了 Renderer 层，Main 进程（agent-runner/sandbox/config）完全复用。

## 快速开始（开发环境）

```bash
# 1. 获取 Open Cowork 基座（二选一）
# 方式 A: GitHub 直连
git clone --depth 1 https://github.com/OpenCoworkAI/open-cowork.git open-cowork
# 方式 B: Gitee 镜像（国内推荐）
# 先去 https://gitee.com 导入 OpenCoworkAI/open-cowork，然后
git clone --depth 1 https://gitee.com/你的用户名/open-cowork.git open-cowork

# 2. 安装依赖 & 跑通
cd open-cowork/
npm install
npm run dev    # 验证能跑起来

# 3. 合并我们的代码
#    将 ../src-coworker/renderer/ 下的文件复制到 src/renderer/
#    修改 src/renderer/App.tsx 为双模入口（普通模式/高级模式切换）

# 4. 部署技能
#    将 ../skills/ 下的技能定义复制到 .claude/skills/
#    将 ../specs/ 下的规范文档保持在项目根目录

# 5. 构建安装包
npm run build
```

## 项目结构

```
coworker/
├── README.md                    ← 你在这里
│
├── docs/                        # 设计文档
│   └── design-v1.md             # 完整产品设计（v1.0）
│
├── specs/                       # 需求与规范
│   ├── requirements.md          # 功能需求 + 非功能需求
│   └── skill-catalog.md         # 24个技能目录
│
├── src-coworker/                # ★ 我们新增的代码
│   └── renderer/
│       ├── components/          # React 组件
│       │   ├── OfficePanel.tsx      # 普通模式首页（任务卡片）
│       │   ├── TaskWizard.tsx       # 技能引导表单
│       │   ├── SkillCard.tsx        # 技能卡片
│       │   ├── ProgressView.tsx     # 流式进度展示
│       │   ├── ResultView.tsx       # 结果+反馈
│       │   ├── ModeSwitcher.tsx     # 普通↔高级切换
│       │   └── FirstRunGuide.tsx    # 首次启动引导
│       ├── store/
│       │   ├── skillStore.ts        # 技能注册/状态管理
│       │   └── feedbackStore.ts     # 反馈收集/进化触发
│       └── types/
│           └── skill-types.ts       # SkillDefinition 等类型
│
├── skills/                      # ★ 我们新增/增强的技能
│   ├── weekly-report/           # P0 MVP
│   ├── doc-writer/              # P0 MVP
│   ├── ppt-generator/           # P0 MVP
│   ├── patent/                  # P0 MVP ★招牌技能
│   ├── doc-reviewer/            # P1 MVP
│   └── email-composer/          # P1 MVP
│
└── open-cowork/                 # Open Cowork 基座（Fork 源）
    └── ...                      # 下载后放入此目录
```

## MVP 技能（v0.1）

| 技能 | 优先级 | 输入 | 输出 |
|------|--------|------|------|
| 📅 写周报 | P0 | 本周工作+亮点 | 格式周报 DOCX |
| 📝 写文档 | P0 | 主题+大纲 | 结构化 DOCX |
| 📊 做PPT | P0 | 内容+风格 | PPTX |
| 📜 写专利 | P0 | 想法/文档/代码 | 三文档（交底书+检索报告+调研分析） |
| 🔍 审文档 | P1 | 文档+维度 | 评审意见 DOCX |
| 📧 写邮件 | P1 | 收件人+要点 | 格式化文本 |

## 专利技能 ★

区别于所有竞品的招牌技能。三种输入 → 专利网初筛 → 8步流程 → 三文档输出。

详见 [设计文档 §4](docs/design-v1.md) 和 [patent/skill.json](skills/patent/skill.json)

## 技术栈

- **基座**: Electron + React + TypeScript + Vite + Tailwind
- **Agent**: pi-coding-agent SDK（封装 Claude Code）
- **沙箱**: WSL2 (Win) / Lima (Mac)
- **Skills**: 基于 `skill.json` 的动态注册系统
- **模型**: 默认 DeepSeek，支持 Claude/GLM/Kimi 等

## 开发路线

```
Week 1: Fork 基座 → OfficePanel → Skill Bridge → TaskWizard 框架
Week 2: 3个技能（周报/文档/PPT） + 流式进度 + 反馈
Week 3: 专利技能（完整）+ 审文档 + 写邮件 + 模式切换 + 打包
Week 4: 首次引导 + 测试 + 发布 v0.1.0
```

## 许可

MIT License — 继承自 Open Cowork
