---
name: doc-audit
description: AI 에이전트용 지시 문서(룰, 스킬, 에이전트)를 검증하고, 기계적으로 따를 수 있는 고수준 규칙서로 생성·교정하는 관제 스킬.
---

# Skill: Document Verification & Generation

## 📌 목표 (Core Objective)
AI 에이전트용 지시 문서(룰, 스킬, 에이전트)를 유형별 구조 기준 + 6대 작성 품질 기준으로 검증하고, 교정하여 고수준 규칙서를 생성한다.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: "규칙을 짜 줘", "스킬을 만들어 줘", "감사(Audit)해 줘"라고 지시하면 발동하라.
- **[REQUIREMENT]**: 발동 전, (1) 지식 베이스 파일 경로, (2) 감사 대상 파일 경로, (3) 생성 요구사항 텍스트 중 1가지 이상을 사용자에게 요구하라.
- **[DO NOT TRIGGER]**: 웹 검색 또는 파일 분류·통합 작업에는 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
- `view_file`: 대상 파일, 지식 베이스, `resources/` 하위 참조 파일을 읽는 데 사용.
- `replace_file_content` / `write_to_file`: 승인 후 수정 반영 시 사용. 승인 없는 덮어쓰기 금지.

## 📋 감사 대상 및 유형 (Audit Scope)
| 유형 | 대상 패턴 | 구조 체크리스트 |
|------|----------|---------------|
| 룰 | `GEMINI.md`, `.rules/**/*.md` | `resources/structure-rule.md` |
| 스킬 | `.agents/skills/**/SKILL.md` | `resources/structure-skill.md` |
| 에이전트 | `.agents/*.md` | `resources/structure-agent.md` |

위 패턴 외 파일의 감사 요청 시, 사용자에게 대상 유형과 범위를 확인하라.

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 1단계: 문서 생성 (Generation)
- **Input:** 지식 베이스 파일 경로 또는 요구사항 텍스트.
- **Process:**
  1. 대상 문서 유형(룰, 스킬, 에이전트)을 판별하라.
  2. 해당 유형의 구조 체크리스트를 `view_file`로 읽고, 필수 섹션 Skeleton을 먼저 생성하라.
  3. `resources/audit-checklist.md`의 **6대 작성 품질 기준**(단호한 명령문, 부정적 제약, 명시적 조건문, Output 템플릿, 명확한 참조 구조, 간결성 및 분리 구조)을 적용하여 내용을 채워라.

### 2단계: 문서 검증 (Auditing)
- **Input:** 감사 대상 파일 경로.
- **Process:**
  1. 대상 문서 유형을 판별하라.
  2. 해당 유형의 구조 체크리스트를 읽고 **구조 검증**을 수행하라.
  3. `resources/audit-checklist.md`를 읽고 **작성 품질 검증**(6대 기준)을 순번대로 수행하라. 건너뛰기 금지.
- 위반 발견 시 [위반 유형(구조/품질) + 기준 번호 + 해당 라인 + 수정 Diff]를 기록하라.
- **[필수]** 사용자 승인 전 파일을 임의 수정하지 마라.

### 3단계: 리포트 (Handover)
- `resources/audit-template.md`의 Skeleton을 그대로 사용하여 리포트를 작성하라.
- 사용자의 반영 승인을 대기하라.

### 4단계: 수정 반영 및 재검증 (Apply & Re-verify)
- **[WHEN]**: 사용자가 3단계 리포트의 수정안을 승인했을 때만 실행하라.
- **Process:**
  1. 리포트의 수정 Diff를 대상 파일에 적용하라.
  2. 2단계(검증)를 다시 실행하라.
  3. PASS가 아니면 추가 수정안을 제시하고 3단계로 돌아가라.


## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] 사용자 승인 전 로컬 파일을 어떠한 도구로도 덮어쓰거나 수정하지 마라.
- [DANGER] 사람이 읽기 좋게 어조를 부드럽게 다듬는 산문적 편집을 금지한다. 규칙은 기계 통제용이다.
