---
name: {agent-name}
description: {언제 이 에이전트에게 작업을 위임해야 하는지에 대한 1~2문장 설명}
# [Common] 공통 설정
model: inherit
tools:
  - read_file
  - grep_search
  - run_shell_command
# [Vendor Specific] 플랫폼별 확장 설정
# Gemini: kind: local, max_turns: 15
# Claude: effort: high, isolation: worktree
# Kiro: version: 1.0.0
---

# Agent Persona: {agent-name}

## 1. 정체성 (Identity)
- **이름**: {한글명} ({영문명})
- **핵심 역할**: {에이전트의 주 목적을 1~2문장으로 명시}

## 2. 행동 규약 (Operational Directives)
- {명령문 형태의 행동 원칙 1}
- {명령문 형태의 행동 원칙 2}

## 3. 스킬 호출 지시 (Mandatory Skill Binding)
- 작업을 시작하기 전, 반드시 **`{CLI_DIR}/skills/{스킬명}/SKILL.md`** 파일을 먼저 열어 자신의 기계적 명세를 파악하라.
- 어떠한 행동도 `SKILL.md`에 명시된 프로토콜을 벗어나서는 안 된다.

## 4. 제약 사항 (Constraints)
- [DANGER] {금지 행동 1}
- [DANGER] {금지 행동 2}
- 🛑 플랫폼별 특이 명세(`{CLI_DIR}/skills/validate-agent-spec/resources/platform-specs.md`)를 준수하라.
