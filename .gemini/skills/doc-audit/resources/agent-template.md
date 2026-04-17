# Agent Template (Gemini & Claude Code)

본 템플릿은 **Gemini CLI** 및 **Claude Code**에서 커스텀 서브에이전트(Sub-agent)를 정의할 때 사용하는 Markdown 템플릿입니다. 
양쪽 CLI 모두 YAML Frontmatter를 통해 에이전트의 속성을 정의합니다.

## 디렉토리 위치
- **Gemini CLI**: `.gemini/agents/{agent-name}.md`
- **Claude Code**: `.claude/agents/{agent-name}.md` (또는 전역 `~/.claude/agents/`)

## 주요 Frontmatter 스키마

| 필드명 | 타입 | CLI 지원 | 필수 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `name` | string | 공통 | **Yes** | 에이전트의 고유 식별자 (소문자, 숫자, 하이픈) |
| `description` | string | 공통 | **Yes** | 메인 에이전트가 위임 여부를 판단하는 핵심 설명 (이전의 `role`을 대체) |
| `kind` | string | Gemini | No | `local`(기본값) 또는 `remote` |
| `tools` | array | 공통 | No | 에이전트가 사용할 도구 목록. (예: `read_file`, `grep_search`, `Bash`) |
| `disallowedTools`| array | Claude | No | 에이전트가 사용을 금지할 도구 목록 |
| `mcpServers` | object | Gemini | No | 이 에이전트 전용으로 분리된 MCP 서버 설정 |
| `model` | string | 공통 | No | 특정 모델을 지정 (예: `gemini-3-flash-preview`, `sonnet`, `haiku`, `inherit`) |
| `temperature` | number | Gemini | No | 모델의 Temperature (0.0 ~ 2.0, 기본값 1) |
| `max_turns` | number | Gemini | No | 작업 위임 후 반환 전 최대 대화 턴 수 (기본값 30) |
| `effort` | string | Claude | No | 추론 노력 수준 (`low`, `medium`, `high`, `max` - max는 Opus 전용) |
| `isolation` | string | Claude | No | `worktree` 지정 시 변경 사항 없는 격리된 임시 Git 작업 트리에서 실행 |
| `initialPrompt`| string | Claude | No | 에이전트 시작 시 자동으로 제출될 첫 번째 사용자 메시지 |
| `color` | string | Claude | No | UI에 표시될 에이전트 색상 (`red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`) |
| `permissionMode`| string | Claude | No | 권한 모드 (`acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`) |
| `hooks` | object | Claude | No | 서브에이전트 레벨 훅 (`PreToolUse`, `PostToolUse`, `Stop`) |
| `memory` | string | Claude | No | 세션 간 지식 유지 범위 (`user`, `project`, `local`) |

## 생성 시 Skeleton

아래 구조를 복사하여 새로운 에이전트를 생성하라:

```markdown
---
name: {agent-name}
description: {언제 이 에이전트에게 작업을 위임해야 하는지에 대한 1~2문장 설명}
# [Optional] 공통 설정
model: inherit
tools:
  - read_file
  - grep_search
  - run_shell_command
# [Optional] Gemini CLI 전용
kind: local
temperature: 0.2
max_turns: 15
# [Optional] Claude Code 전용
# effort: high
# isolation: worktree
# permissionMode: bypassPermissions
# memory: project
# color: purple
---

# Agent Persona: {agent-name}

## 1. 정체성 (Identity)
- **이름**: {한글명} ({영문명})
- **핵심 역할**: {에이전트의 주 목적 명시}

## 2. 행동 규약 (Operational Directives)
- {명령문 형태의 행동 원칙 1}
- {명령문 형태의 행동 원칙 2}

## 3. 스킬 호출 지시 (Mandatory Skill Binding)
- 작업을 시작하기 전, 반드시 **`.agents/skills/{스킬명}/SKILL.md`** 파일을 먼저 열어 자신의 기계적 명세를 파악하라.
- 어떠한 행동도 `SKILL.md`에 명시된 프로토콜을 벗어나서는 안 된다.

## 4. 제약 사항 (Constraints)
- [DANGER] {금지 행동 1}
- [DANGER] {금지 행동 2}
```
