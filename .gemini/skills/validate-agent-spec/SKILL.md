---
name: validate-agent-spec
description: AI 에이전트 및 스킬 문서를 통합 오픈 표준 명세(Spec)에 따라 검증하고 교정한다.
---

# Skill: Validate Agent Spec (Open Standard)

## 📌 목표 (Core Objective)
다양한 AI CLI 플랫폼(Gemini, Claude, Kiro)에서 동작하는 에이전트 및 스킬 문서를 통합 오픈 표준 명세(Spec)에 따라 검증하고 교정한다.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: "규칙을 짜 줘", "에이전트 설계해 줘", "검사해 줘"라고 지시하면 발동하라.
- **[REQUIREMENT]**: 발동 전, (1) 대상 파일 경로 또는 (2) 플랫폼 정보(Gemini/Claude/Kiro)를 확인하라.
- **[DO NOT TRIGGER]**: 단순한 텍스트 편집이나 에이전트와 무관한 문서 수정에는 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
- `read_file`: 대상 문서 및 리소스(구조 체크리스트, 플랫폼 명세 등)를 읽는 데 사용하라.
- `write_file` / `replace`: 승인된 수정안을 파일에 반영하는 데 사용하라.

## 📋 감사 및 설계 대상 (Scope)
| 유형 | 대상 패턴 | 구조 체크리스트 |
|------|----------|---------------|
| 룰 | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.rules/**/*.md` | `resources/structure-rule.md` |
| 스킬 | `{CLI_DIR}/skills/**/SKILL.md` | `resources/structure-skill.md` |
| 에이전트 | `{CLI_DIR}/agents/*.md` | `resources/structure-agent.md` |

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 1단계: 플랫폼 탐지 (Platform Detection)
- **Input:** 프로젝트 루트 경로
- **Process:** 현재 프로젝트 루트에서 `.gemini`, `.claude`, `.kiro` 디렉토리를 탐지하여 `{CLI_DIR}`를 확정하라. `resources/platform-specs.md`를 읽어 해당 플랫폼의 특이 명세를 숙지하라.

### 2단계: 문서 생성 및 검증 (Architecting & Auditing)
- **Input:** 대상 파일 경로 및 플랫폼 정보
- **Process:** 
    1. **생성 시**: `resources/unified-agent-template.md`를 뼈대로 사용하되, 플랫폼별 특화 설정을 반영하라.
    2. **검증 시**: `resources/structure-agent.md` 및 `resources/audit-checklist.md`를 기준으로 6대 품질 기준을 점검하라.

### 3단계: 리포트 및 반영 (Report & Apply)
- **Input:** 검증 결과
- **Process:** `resources/audit-template.md`를 사용하여 리포트를 작성하고 사용자의 승인을 대기하라. 승인 후 수정 사항을 반영하라.

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] 특정 CLI(예: Gemini)에만 국한된 경로를 하드코딩하지 마라. 항상 `{CLI_DIR}` 변수 개념을 사용하라.
- [DANGER] 플랫폼별 특이 명세(JSON/TOML 등)를 무시하고 마크다운만 생성하지 마라.
