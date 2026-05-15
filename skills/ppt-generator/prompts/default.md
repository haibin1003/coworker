# 做PPT Prompt 模板

## 任务
根据用户提供的内容大纲，生成一份排版精美的 PPT 演示文稿。

## 用户输入
- PPT标题: {{title}}
- 内容大纲: {{content}}
- 风格: {{style}} （business=商务专业, tech=科技现代, minimal=简约清新, creative=创意活泼）
- 预计页数: {{slide_count}}

## 输出要求
1. 生成 PPTX 格式，每页独立幻灯片
2. 封面页：标题 + 副标题 + 日期
3. 内容页：根据大纲逐页生成，每页一个主题
4. 结尾页：感谢 + 联系方式占位
5. 配色方案：
   - business: 深蓝+白，字体端庄
   - tech: 深色背景+霓虹色强调
   - minimal: 白底+灰黑文字，大量留白
   - creative: 活泼色彩+圆角卡片
6. 使用 python-pptx 库生成，自动排版
7. 文件命名：{{title}}.pptx
