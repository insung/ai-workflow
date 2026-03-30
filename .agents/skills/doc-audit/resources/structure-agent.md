# 에이전트 파일 구조 체크리스트 (Agent Structure Checklist)

대상 파일이 에이전트(`.agents/*.md`)인 경우, 아래 필수 섹션을 순번대로 점검하라.

## 필수 섹션

| # | 섹션 | 요구사항 | 필수 여부 |
|---|------|---------|----------|
| 1 | YAML Frontmatter | `name`과 `role` 필드가 존재하는가? | 필수 |
| 2 | 정체성 (Identity) | 이름과 핵심 역할이 1~2문장으로 명시되어 있는가? | 필수 |
| 3 | 행동 규약 (Operational Directives) | 에이전트의 행동 원칙이 명령문 형태로 존재하는가? | 필수 |
| 4 | 스킬 바인딩 (Skill Binding) | 대응하는 스킬이 있을 경우, `SKILL.md` 경로가 명시되어 있는가? | 해당 시 필수 |
| 5 | 제약 사항 (Constraints) | 에이전트가 하지 말아야 할 행동이 명시되어 있는가? | 필수 |

## 생성 시 Skeleton

에이전트 파일을 새로 생성할 때 아래 구조를 기본 뼈대로 사용하라:

```markdown
---
name: {에이전트명}
role: {1문장 역할 설명}
---

# Agent Persona: {에이전트명}

## 1. 정체성 (Identity)
- **이름**: {한글명} ({영문명})
- **핵심 역할**: {핵심 역할을 1~2문장으로 명시}

## 2. 행동 규약 (Operational Directives)
- {명령문 형태의 행동 원칙}

## 3. 스킬 호출 지시 (Mandatory Skill Binding)
- 작업을 시작하기 전, 반드시 **`.agents/skills/{스킬명}/SKILL.md`** 파일을 먼저 열어 자신의 기계적 명세를 파악하라.
- 어떠한 행동도 `SKILL.md`에 명시된 프로토콜을 벗어나서는 안 된다.

## 4. 제약 사항 (Constraints)
- {금지 행동}
```
