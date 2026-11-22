# shuyi-learning ｜数一笔记

一个面向考研数学一的 AI 伴学 Skill：以指定教师的课程为主线，完成「预习 → 跟课 → 带做 → 独立练习 → 诊断 → 复盘」的闭环，并把过程沉淀成可打印的折页与可持续追踪的进度记录。

采用通用 Agent Skill 结构（`SKILL.md` + YAML frontmatter + 按需加载的 `references/`），不依赖任何外部服务。

## 它做什么

主流程固定为一条闭环，一次只推进一个环节：

```
定位 → 简讲 → 带做 → 独立作答 → 按表现处理 → 写回进度
```

能力按 11 个模块切分，命中路由才加载，不预读无关内容：

| 场景 | 模块 |
|---|---|
| 新章、知识点讲解、例题带做、独立练习 | `references/01-teaching.md` |
| 批改、看过程、错题照片、卡住、没思路 | `references/02-grading.md` |
| 讲题、首讲（章内 HTML） | `references/03-problem-page.md` |
| 页内提问、问答历史 | `references/04-qa-log.md` |
| 进度读写、掌握判定、掌握画像 | `references/05-progress.md` |
| 排计划、每日任务、集中刷题 | `references/06-planning.md` |
| 章末整理、打印、出折页 | `references/07-handout.md` |
| 折页排版、字体字号、PDF 规格 | `references/08-layout.md` |
| 数形结合、画图、函数图像 | `references/09-plotting.md` |
| 改卷、整卷批改、整章复测 | `references/10-assessment.md` |
| 复检、查漏、结算 | `references/11-recheck.md` |

产物只有五类，刻意收敛：章内一份错题本 HTML、章末两份 A5 折页（笔记 / 错题）、每章一份 `进度.md`、章内复检卷、每章一份 `掌握画像.md`。

## 目录结构

```
shuyi-learning/
├── SKILL.md                  入口：主流程、路由表、全局不变量、输出标准
├── config.md                 板级配置：教师、教材、目标、产物路径
├── SPEC.md                   维护规范：结构约定、规则归属、增删改流程、校验清单
├── agents/openai.yaml        界面元数据（显示名、简介、默认提示）
├── references/01..11-*.md    功能模块，每个模块自带接口头（输入 / 输出 / 依赖 / 不负责）
└── assets/                   输出骨架，不承载规则
    ├── explain-template.html    错题本页面模板（KaTeX 内联，离线可用）
    ├── gen-recheck.mjs          复检卷生成器
    ├── recheck.css              复检卷样式
    └── recheck.client.js        复检卷交互
```

## 安装

将仓库目录放到技能目录下即可被发现，目录名需与 `SKILL.md` 中的 `name` 一致。

```bash
# 克隆到技能目录（请将 URL 替换为你的 GitHub 仓库地址）
git clone https://github.com/<用户名>/shuyi_learning.git ~/.workbuddy/skills/shuyi-learning
```

也可以下载 ZIP 后解压到 `~/.workbuddy/skills/shuyi-learning/`，然后重启客户端。

Windows 下技能目录通常为：

```text
C:\Users\<用户名>\.workbuddy\skills\shuyi-learning
```

## 首次配置

打开 `config.md`，将 `paths` 下的占位路径替换为本机目录。配置文件只描述学习产物的落盘位置，不需要把个人学习资料提交到仓库。

```yaml
paths:
  site_root: C:\\Users\\<用户名>\\Desktop\\Study
  math_root: C:\\Users\\<用户名>\\Desktop\\Study\\数一
  url_base: http://127.0.0.1:8765/数一
  packet_root: C:\\Users\\<用户名>\\WorkBuddy
```

教师、课程、教材和题目来源也可在 `config.md` 顶部统一调整。

## 依赖

- 技能主体无需网络：错题本模板内的 KaTeX 为内联打包，断网可用。
- 生成复检卷需要 Node.js 18 或更高版本（`assets/gen-recheck.mjs`）；其余功能纯 Markdown 驱动。
- 绘图请求默认输出可直接粘贴的 GeoGebra 命令，不依赖本地绘图库。
- 可选：运行 `python quick_validate.py` 检查路由、接口头和文件结构。

## 维护

`SPEC.md` 是这个技能自己的工程规范：单一 owner 原则、模块接口头、增删改流程和校验清单。修改前先读它，改动按其中的流程执行。

## 许可证

本项目采用 MIT License，详见 `LICENSE`。课程、教材、题目和用户学习资料不随本仓库分发。

## 说明

- 课程、教材、题目均来自用户实际使用的资源，本仓库不附带任何课程视频、教材扫描件或题库。
- 课程链接仅作为配置示例，实际课程章节与题目顺序以用户可见资料为准。
