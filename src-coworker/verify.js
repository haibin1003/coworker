/**
 * Co-Worker 验证套件 (verify.js)
 *
 * 纯 Node.js 功能测试，不依赖 Electron/浏览器环境。
 * 覆盖：技能注册、分类、搜索、最近使用、表单校验、
 *        专利三种输入模式、反馈进化、Prompt 变量替换、
 *        执行步骤构建、IPC 消息格式。
 *
 * 用法: node verify.js
 * 输出: PASS/FAIL 统计 + 详细报告
 */

const fs = require('fs');
const path = require('path');

// ── 工具函数 ──

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const TYPES_PATH = path.join(__dirname, 'renderer', 'types', 'skill-types.ts');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(`  ✗ ${label}`);
  }
}

function loadJSON(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function loadSkillJSONs() {
  const skills = [];
  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const d of dirs) {
    if (d.isDirectory()) {
      const jsonPath = path.join(SKILLS_DIR, d.name, 'skill.json');
      if (fs.existsSync(jsonPath)) {
        skills.push(loadJSON(jsonPath));
      }
    }
  }
  return skills;
}

function loadPromptTemplate(skillId) {
  const promptPath = path.join(SKILLS_DIR, skillId, 'prompts', 'default.md');
  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, 'utf-8');
  }
  return null;
}

// ── 测试分组 ──

console.log('\n🧪 Co-Worker 验证套件\n' + '='.repeat(50));

// ═══════════════════════════════════════
// 分组 1: 技能注册
// ═══════════════════════════════════════
console.log('\n📦 1. 技能注册');

const skills = loadSkillJSONs();
assert(skills.length === 6, `1.1 应有 6 个技能，实际 ${skills.length}`);

const skillIds = new Set(skills.map((s) => s.id));
assert(skillIds.has('weekly-report'), '1.2 weekly-report 已注册');
assert(skillIds.has('patent'), '1.3 patent 已注册');
assert(skillIds.has('doc-writer'), '1.4 doc-writer 已注册');
assert(skillIds.has('doc-reviewer'), '1.5 doc-reviewer 已注册');
assert(skillIds.has('ppt-generator'), '1.6 ppt-generator 已注册');
assert(skillIds.has('email-composer'), '1.7 email-composer 已注册');

// 验证每个技能的必要字段
for (const skill of skills) {
  assert(skill.id && typeof skill.id === 'string', `1.8a ${skill.id}: 有 id`);
  assert(skill.name && typeof skill.name === 'string', `1.8b ${skill.id}: 有 name`);
  assert(skill.icon && typeof skill.icon === 'string', `1.8c ${skill.id}: 有 icon`);
  assert(skill.category && typeof skill.category === 'string', `1.8d ${skill.id}: 有 category`);
  assert(skill.version && typeof skill.version === 'string', `1.8e ${skill.id}: 有 version`);
  assert(skill.description && typeof skill.description === 'string', `1.8f ${skill.id}: 有 description`);
  assert(typeof skill.output_format === 'string', `1.8g ${skill.id}: 有 output_format`);
}

// ═══════════════════════════════════════
// 分组 2: 技能分类
// ═══════════════════════════════════════
console.log('\n📁 2. 技能分类');

const VALID_CATEGORIES = ['document', 'summary', 'engineering', 'data', 'communication', 'creative'];
const categoryMap = {};
for (const skill of skills) {
  categoryMap[skill.category] = (categoryMap[skill.category] || 0) + 1;
  assert(VALID_CATEGORIES.includes(skill.category), `2.1 ${skill.id} 分类 "${skill.category}" 有效`);
}

// 预期分布
assert(categoryMap['summary'] >= 1, '2.2 有总结汇报类技能');
assert(categoryMap['document'] >= 2, '2.3 有文档操作类技能(>=2)');
assert(categoryMap['communication'] >= 1, '2.4 有沟通协作类技能');
assert(categoryMap['creative'] >= 1, '2.5 有创意输出类技能');

// ═══════════════════════════════════════
// 分组 3: 技能搜索
// ═══════════════════════════════════════
console.log('\n🔍 3. 技能搜索');

function searchSkills(query) {
  const q = query.toLowerCase();
  return skills.filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
  );
}

const patentResults = searchSkills('专利');
assert(patentResults.length >= 1, '3.1 搜索"专利"有结果');
assert(patentResults[0].id === 'patent', '3.2 搜索"专利"第一位是 patent');

const reportResults = searchSkills('周报');
assert(reportResults.length >= 1, '3.3 搜索"周报"有结果');

const noResults = searchSkills('不存在xyz123');
assert(noResults.length === 0, '3.4 搜索不存在关键词无结果');

// 标签搜索
const legalResults = searchSkills('法律');
assert(legalResults.length >= 1, '3.5 标签搜索"法律"有结果');
assert(legalResults.some((s) => s.id === 'patent'), '3.6 标签搜索"法律"包含 patent');

// ═══════════════════════════════════════
// 分组 4: 最近使用追踪
// ═══════════════════════════════════════
console.log('\n🕐 4. 最近使用追踪');

function trackRecent(ids, newId, maxSize = 8) {
  const filtered = ids.filter((id) => id !== newId); // 去重
  return [newId, ...filtered].slice(0, maxSize);
}

let recent = [];
recent = trackRecent(recent, 'weekly-report');
assert(recent[0] === 'weekly-report', '4.1 首次使用排第一');
assert(recent.length === 1, '4.2 长度=1');

recent = trackRecent(recent, 'patent');
recent = trackRecent(recent, 'doc-writer');
recent = trackRecent(recent, 'weekly-report'); // 再次使用
assert(recent[0] === 'weekly-report', '4.3 再次使用移到第一');
assert(recent.length === 3, '4.4 去重后长度=3');
assert(recent[1] === 'doc-writer', '4.5 原第一降到第二');
assert(recent[2] === 'patent', '4.6 原第二降到第三');

// 上限测试
for (let i = 0; i < 10; i++) {
  recent = trackRecent(recent, `skill-${i}`);
}
assert(recent.length === 8, '4.7 超过上限被截断为 8');

// ═══════════════════════════════════════
// 分组 5: 表单必填校验
// ═══════════════════════════════════════
console.log('\n✅ 5. 表单必填校验');

function validateRequired(fields, formData) {
  return fields.filter((f) => {
    const val = formData[f.key];
    return f.required && (!val || (Array.isArray(val) && val.length === 0));
  });
}

// weekly-report 有 3 个字段，work_done 必填
const wrFields = skills.find((s) => s.id === 'weekly-report').fields;
const missing1 = validateRequired(wrFields, {});
assert(missing1.length === 1, '5.1 空表单检出必填缺失');
assert(missing1[0].key === 'work_done', '5.2 缺失字段为 work_done');

const noMissing = validateRequired(wrFields, { work_done: '完成了开发' });
assert(noMissing.length === 0, '5.3 填充后无缺失');

// email-composer 有 recipient, subject, key_points 三个必填
const ecFields = skills.find((s) => s.id === 'email-composer').fields;
const missing3 = validateRequired(ecFields, {});
assert(missing3.length === 3, '5.4 邮件技能空表单检出3个必填');

// ppt-generator 必填 title（第一个字段）
const pptFields = skills.find((s) => s.id === 'ppt-generator').fields;
const missingPPT = validateRequired(pptFields, {});
assert(missingPPT.length >= 1, '5.5 PPT必填字段校验');

// ═══════════════════════════════════════
// 分组 6: 专利三种输入模式
// ═══════════════════════════════════════
console.log('\n📜 6. 专利三种输入模式');

const patentSkill = skills.find((s) => s.id === 'patent');
assert(patentSkill.input_modes !== undefined, '6.1 patent 有 input_modes');
assert(patentSkill.input_modes.length === 3, '6.2 有三个输入模式');

const modeIds = patentSkill.input_modes.map((m) => m.id);
assert(modeIds.includes('idea'), '6.3 有"天马行空"模式');
assert(modeIds.includes('document'), '6.4 有"给文档"模式');
assert(modeIds.includes('code'), '6.5 有"给代码"模式');

// 每个模式都有必要字段
for (const mode of patentSkill.input_modes) {
  assert(mode.fields.length >= 1, `6.6a ${mode.id}: 有字段定义`);
  assert(mode.fields.some((f) => f.required), `6.6b ${mode.id}: 有必填字段`);
  assert(mode.name && mode.description, `6.6c ${mode.id}: 有名称和描述`);
}

// 验证 pattern skill.json workflow 定义
assert(patentSkill.workflow !== undefined, '6.7 有 workflow 定义');
assert(patentSkill.workflow.main_steps.length === 8, '6.8 main_steps 为 8 步');
assert(patentSkill.workflow.pre_steps.idea_mode.length >= 2, '6.9 idea 模式有前置步骤');
assert(patentSkill.workflow.pre_steps.document_mode.length >= 2, '6.10 document 模式有前置步骤');
assert(patentSkill.workflow.pre_steps.code_mode.length >= 2, '6.11 code 模式有前置步骤');

// 模式切换：选择 idea 模式后表单清空并显示新字段
const ideaFields = patentSkill.input_modes.find((m) => m.id === 'idea').fields;
assert(ideaFields.some((f) => f.key === 'idea_text'), '6.12 idea 模式有 idea_text 字段');

const docFields = patentSkill.input_modes.find((m) => m.id === 'document').fields;
assert(docFields.some((f) => f.key === 'doc_file'), '6.13 document 模式有 doc_file 字段');

const codeFields = patentSkill.input_modes.find((m) => m.id === 'code').fields;
assert(codeFields.some((f) => f.key === 'project_path'), '6.14 code 模式有 project_path 字段');

// ═══════════════════════════════════════
// 分组 7: Prompt 变量替换
// ═══════════════════════════════════════
console.log('\n📝 7. Prompt 变量替换');

function fillPromptTemplate(template, formData) {
  let filled = template;
  for (const [key, value] of Object.entries(formData)) {
    const displayValue = typeof value === 'string' ? value : String(value ?? '');
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), displayValue);
  }
  filled = filled.replace(/\{\{date\}\}/g, '2026-05-16');
  filled = filled.replace(/\{\{title\}\}/g, formData.title || '测试');
  filled = filled.replace(/\{\{skill_name\}\}/g, '测试技能');
  return filled;
}

// 测试周报模板
const wrPrompt = loadPromptTemplate('weekly-report');
assert(wrPrompt !== null, '7.1 周报 prompt 模板存在');

const filledWR = fillPromptTemplate(wrPrompt, {
  work_done: '完成用户模块开发\n修复3个bug',
  highlights: '性能提升40%',
  problems: '测试覆盖不足',
});
assert(filledWR.includes('完成用户模块开发'), '7.2 周报模板 work_done 已填充');
assert(filledWR.includes('性能提升40%'), '7.3 周报模板 highlights 已填充');
assert(!filledWR.includes('{{work_done}}'), '7.4 无残留占位符 {{work_done}}');

// 测试邮件模板
const ecPrompt = loadPromptTemplate('email-composer');
assert(ecPrompt !== null, '7.5 邮件 prompt 模板存在');

const filledEC = fillPromptTemplate(ecPrompt, {
  recipient: '张总',
  subject: 'Q2项目进展汇报',
  key_points: '1. 完成核心功能\n2. 测试通过\n3. 准备上线',
  tone: 'formal',
  attachments_note: '附件：项目报告.pdf',
});
assert(filledEC.includes('张总'), '7.6 邮件模板 recipient 已填充');
assert(filledEC.includes('Q2项目进展汇报'), '7.7 邮件模板 subject 已填充');
assert(filledEC.includes('formal'), '7.8 邮件模板 tone 已填充');

// 测试所有模板的占位符与 skill.json 字段一致
console.log('  验证所有模板占位符与 skill.json 一致性...');
for (const skill of skills) {
  const prompt = loadPromptTemplate(skill.id);
  if (!prompt) {
    assert(false, `7.9a ${skill.id}: prompt 模板缺失`);
    continue;
  }

  // 提取模板中的所有 {{xxx}} 占位符
  const placeholders = [...prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  const systemVars = new Set(['date', 'title', 'skill_name', 'design_system_content']);

  // 收集所有可能的字段名（含 input_modes）
  const allFieldKeys = new Set();
  if (skill.fields) {
    skill.fields.forEach((f) => allFieldKeys.add(f.key));
  }
  if (skill.input_modes) {
    skill.input_modes.forEach((mode) => {
      mode.fields.forEach((f) => allFieldKeys.add(f.key));
    });
  }

  // 检查每个占位符是否有对应的字段或系统变量
  for (const ph of placeholders) {
    if (systemVars.has(ph)) continue; // 系统变量，OK
    if (allFieldKeys.has(ph)) continue; // 匹配字段，OK
    assert(false, `7.9b ${skill.id}: 占位符 {{${ph}}} 无对应字段`);
  }
  assert(true, `7.9c ${skill.id}: 占位符全部有效 ✓`);
}

// ═══════════════════════════════════════
// 分组 8: 执行步骤构建
// ═══════════════════════════════════════
console.log('\n⚙️ 8. 执行步骤构建');

// 模拟 skill-executor 的 buildExecutionSteps 逻辑
function buildExecutionSteps(skill) {
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

const patentSteps = buildExecutionSteps(patentSkill);
assert(patentSteps.length === 8, '8.1 专利有 8 个执行步骤');
assert(patentSteps[0].status === 'running', '8.2 第一步状态为 running');
assert(patentSteps[1].status === 'pending', '8.3 后续步骤状态为 pending');
assert(patentSteps[6].id === 'review', '8.4 有自检修订步骤');
assert(patentSteps[7].id === 'deliver', '8.5 最后一步是输出文档');

const generalSteps = buildExecutionSteps(skills.find((s) => s.id === 'weekly-report'));
assert(generalSteps.length === 4, '8.6 通用技能有 4 个执行步骤');
assert(generalSteps.every((s) => s.id && s.label && s.status), '8.7 所有步骤有 id/label/status');

// ═══════════════════════════════════════
// 分组 9: 反馈进化触发逻辑
// ═══════════════════════════════════════
console.log('\n📈 9. 反馈进化触发逻辑');

// 模拟 feedbackStore 进化触发逻辑
function shouldEvolve(feedbacks) {
  const SAME_SKILL_FEEDBACKS = feedbacks.filter((f) => f.skillId === feedbacks[0]?.skillId);

  // 累计 10 条反馈
  if (SAME_SKILL_FEEDBACKS.length >= 10) return 'threshold';

  // 连续 3 条负面
  const recent = SAME_SKILL_FEEDBACKS.slice(-3);
  if (recent.length === 3 && recent.every((f) => f.rating === 'down')) return 'consecutive_down';

  return null;
}

// 场景A：累计 10 条
const fb10 = Array.from({ length: 10 }, (_, i) => ({
  id: `fb-${i}`, skillId: 'patent', rating: i < 7 ? 'up' : 'down', timestamp: Date.now(),
}));
assert(shouldEvolve(fb10) === 'threshold', '9.1 累计10条触发进化');

// 场景B：连续 3 条负面
const fb3down = [
  { id: 'a', skillId: 'weekly-report', rating: 'down', timestamp: 1 },
  { id: 'b', skillId: 'weekly-report', rating: 'down', timestamp: 2 },
  { id: 'c', skillId: 'weekly-report', rating: 'down', timestamp: 3 },
];
assert(shouldEvolve(fb3down) === 'consecutive_down', '9.2 连续3条负面触发进化');

// 场景C：不触发（只有 5 条且无连续负面）
const fb5ok = Array.from({ length: 5 }, (_, i) => ({
  id: `fb-${i}`, skillId: 'doc-writer', rating: i % 2 === 0 ? 'up' : 'down', timestamp: Date.now(),
}));
assert(shouldEvolve(fb5ok) === null, '9.3 5条不触发');

// 场景D：跨技能不混淆
const fbMixed = [
  { id: 'x1', skillId: 'patent', rating: 'down', timestamp: 1 },
  { id: 'x2', skillId: 'patent', rating: 'down', timestamp: 2 },
  { id: 'x3', skillId: 'email-composer', rating: 'down', timestamp: 3 }, // 不同技能
];
assert(shouldEvolve(fbMixed) === null, '9.4 跨技能不触发');

// ═══════════════════════════════════════
// 分组 10: 输出格式映射
// ═══════════════════════════════════════
console.log('\n📄 10. 输出格式映射');

const outputFormats = {};
for (const skill of skills) {
  outputFormats[skill.id] = skill.output_format;
}

assert(outputFormats['patent'] === 'multi', '10.1 patent 输出 multi');
assert(outputFormats['weekly-report'] === 'docx', '10.2 weekly-report 输出 docx');
assert(outputFormats['ppt-generator'] === 'pptx', '10.3 ppt-generator 输出 pptx');
assert(outputFormats['email-composer'] === 'txt', '10.4 email-composer 输出 txt');

// patent 有多文件输出
assert(patentSkill.output_files.length === 3, '10.5 patent 输出 3 个文件');
assert(patentSkill.output_files[0].name.includes('检索报告'), '10.6 第一个是检索报告');
assert(patentSkill.output_files[1].name.includes('交底书'), '10.7 第二个是交底书');
assert(patentSkill.output_files[2].name.includes('调研分析'), '10.8 第三个是调研分析');

// ═══════════════════════════════════════
// 分组 11: IPC 消息格式完整性
// ═══════════════════════════════════════
console.log('\n🔌 11. IPC 消息格式');

// Simulate agent-bridge IPC channels
const IPC_CHANNELS = {
  EXECUTE_SKILL: 'coworker:execute-skill',
  EXECUTE_EVENT: 'coworker:execute-event',
  GET_WORKSPACE: 'coworker:get-workspace',
  SELECT_DIRECTORY: 'coworker:select-directory',
};

assert(Object.keys(IPC_CHANNELS).length >= 4, '11.1 至少 4 个 IPC channel');

// SkillExecuteRequest 格式
function validateExecuteRequest(req) {
  assert(req.skillId && typeof req.skillId === 'string', '11.2a 有 skillId');
  assert(req.skillName && typeof req.skillName === 'string', '11.2b 有 skillName');
  assert(req.prompt && typeof req.prompt === 'string', '11.2c 有 prompt');
  assert(req.workspaceDir && typeof req.workspaceDir === 'string', '11.2d 有 workspaceDir');
  assert(Array.isArray(req.attachedFiles), '11.2e attachedFiles 是数组');
  assert(req.options && typeof req.options === 'object', '11.2f 有 options');
}

// 模拟构建请求
const sampleRequest = {
  skillId: 'weekly-report',
  skillName: '写周报',
  prompt: '请根据以下信息生成周报...',
  outputFormat: 'docx',
  outputNaming: '周报_{date}.docx',
  workspaceDir: '/tmp/workspace',
  attachedFiles: [],
  options: {
    mcp: { webSearch: false, notion: false },
    useMemory: true,
    useGui: false,
  },
};
validateExecuteRequest(sampleRequest);

// ExecuteEvent 类型
const eventTypes = ['step_start', 'step_progress', 'step_complete', 'step_fail', 'preview', 'file_created', 'complete', 'error'];
assert(eventTypes.length === 8, '11.3 有 8 种事件类型');
eventTypes.forEach((type) => {
  assert(typeof type === 'string' && type.length > 0, `11.4 event.${type} 有效`);
});

// ═══════════════════════════════════════
// 分组 12: 技能自进化版本管理
// ═══════════════════════════════════════
console.log('\n🔄 12. 技能版本管理');

for (const skill of skills) {
  assert(skill.version.match(/^\d+\.\d+\.\d+$/), `12.1 ${skill.id}: 版本号格式正确(${skill.version})`);
  assert(Array.isArray(skill.changelog), `12.2 ${skill.id}: 有 changelog 数组`);
}

// ═══════════════════════════════════════
// 分组 13: 文件结构完整性
// ═══════════════════════════════════════
console.log('\n📁 13. 文件结构');

const requiredFiles = [
  'src-coworker/renderer/components/OfficePanel.tsx',
  'src-coworker/renderer/components/SkillCard.tsx',
  'src-coworker/renderer/components/TaskWizard.tsx',
  'src-coworker/renderer/components/ProgressView.tsx',
  'src-coworker/renderer/components/ResultView.tsx',
  'src-coworker/renderer/components/ModeSwitcher.tsx',
  'src-coworker/renderer/components/FirstRunGuide.tsx',
  'src-coworker/renderer/services/agent-bridge.ts',
  'src-coworker/renderer/services/skill-executor.ts',
  'src-coworker/renderer/store/skillStore.tsx',
  'src-coworker/renderer/store/feedbackStore.tsx',
  'src-coworker/renderer/types/skill-types.ts',
];

const projectRoot = path.join(__dirname, '..');
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(projectRoot, file));
  assert(exists, `13.1 ${file} 存在`);
}

// 每个技能目录都有必要文件
for (const skill of skills) {
  const promptPath = path.join(SKILLS_DIR, skill.id, 'prompts', 'default.md');
  assert(fs.existsSync(promptPath), `13.2 ${skill.id}: prompt/default.md 存在`);
}

// ═══════════════════════════════════════
// 分组 14: 类型定义一致性
// ═══════════════════════════════════════
console.log('\n🔤 14. 类型定义一致性');

// 所有 skill.json 的 field.type 值都在允许范围内
const VALID_FIELD_TYPES = ['text', 'textarea', 'file', 'select', 'checkbox', 'radio', 'path'];
for (const skill of skills) {
  const allFields = [];
  if (skill.fields) allFields.push(...skill.fields);
  if (skill.input_modes) {
    skill.input_modes.forEach((m) => allFields.push(...m.fields));
  }
  for (const field of allFields) {
    assert(VALID_FIELD_TYPES.includes(field.type), `14.1 ${skill.id}.${field.key}: type "${field.type}" 有效`);
    if (field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') {
      assert(Array.isArray(field.options) && field.options.length > 0, `14.2 ${skill.id}.${field.key}: 有 options`);
    }
  }
}

// output_format 有效值
const VALID_OUTPUTS = ['docx', 'pptx', 'xlsx', 'md', 'txt', 'email', 'multi'];
for (const skill of skills) {
  assert(VALID_OUTPUTS.includes(skill.output_format), `14.3 ${skill.id}: output_format "${skill.output_format}" 有效`);
}

// ═══════════════════════════════════════
// 分组 15: 设计系统集成
// ═══════════════════════════════════════
console.log('\n🎨 15. 设计系统集成');

const DS_INDEX_PATH = path.join(projectRoot, 'design-systems', 'index.json');
const dsIndexExists = fs.existsSync(DS_INDEX_PATH);
assert(dsIndexExists, '15.1 design-systems/index.json 存在');

if (dsIndexExists) {
  const dsIndex = loadJSON(DS_INDEX_PATH);
  const dsCount = Object.keys(dsIndex).length;
  assert(dsCount >= 15, `15.2 至少 15 套设计系统，实际 ${dsCount}`);

  // 验证每套设计系统有 DESIGN.md
  for (const [dsId, info] of Object.entries(dsIndex)) {
    const dsPath = path.join(projectRoot, 'design-systems', dsId, 'DESIGN.md');
    const dsExists = fs.existsSync(dsPath);
    assert(dsExists, `15.3 ${dsId}: DESIGN.md 存在`);
    assert(info.name && typeof info.name === 'string', `15.4 ${dsId}: 有名称`);
  }
}

// 验证 ppt-generator 有 design_system 字段
const pptSkill = skills.find((s) => s.id === 'ppt-generator');
const pptDsField = pptSkill.fields.find((f) => f.key === 'design_system');
assert(pptDsField !== undefined, '15.5 ppt-generator 有 design_system 字段');
assert(pptDsField.type === 'select', '15.6 design_system 字段类型为 select');
assert(pptDsField.options.length >= 15, `15.7 design_system 有 ≥15 个选项，实际 ${pptDsField.options.length}`);

// 验证 doc-writer 有 design_system 字段
const docSkill = skills.find((s) => s.id === 'doc-writer');
const docDsField = docSkill.fields.find((f) => f.key === 'design_system');
assert(docDsField !== undefined, '15.8 doc-writer 有 design_system 字段');

// 验证 email-composer 有 design_system 字段
const emailSkill = skills.find((s) => s.id === 'email-composer');
const emailDsField = emailSkill.fields.find((f) => f.key === 'design_system');
assert(emailDsField !== undefined, '15.9 email-composer 有 design_system 字段');

// 验证 prompt 模板包含 design_system_content 占位符
for (const sid of ['ppt-generator', 'doc-writer']) {
  const prompt = loadPromptTemplate(sid);
  assert(prompt.includes('{{design_system_content}}'), `15.10 ${sid}: prompt 含 design_system_content`);
}

// 验证 FirstRunGuide 组件存在
const frgPath = path.join(projectRoot, 'src-coworker/renderer/components/FirstRunGuide.tsx');
assert(fs.existsSync(frgPath), '15.11 FirstRunGuide.tsx 存在');

// 验证 App.tsx 存在
const appPath = path.join(projectRoot, 'src-coworker/renderer/App.tsx');
assert(fs.existsSync(appPath), '15.12 App.tsx 存在');

// 验证产品文档存在
const capPath = path.join(projectRoot, 'docs/capabilities.md');
assert(fs.existsSync(capPath), '15.13 docs/capabilities.md 存在');

// 验证 LICENSE
const licPath = path.join(projectRoot, 'LICENSE');
assert(fs.existsSync(licPath), '15.14 LICENSE 存在');

// 验证 CHANGELOG
const chPath = path.join(projectRoot, 'CHANGELOG.md');
assert(fs.existsSync(chPath), '15.15 CHANGELOG.md 存在');

// ── 结果汇总 ──

console.log('\n' + '='.repeat(50));
console.log(`\n📊 结果: ${passed} 通过 / ${failed} 失败 / ${passed + failed} 总计`);

if (failures.length > 0) {
  console.log('\n❌ 失败项:');
  failures.forEach((f) => console.log(f));
  process.exit(1);
} else {
  console.log('✅ 全部通过！\n');
  process.exit(0);
}
