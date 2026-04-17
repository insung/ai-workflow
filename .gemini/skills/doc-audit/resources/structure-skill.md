# 스킬 파일 구조 체크리스트 (Skill Structure Checklist)

대상 파일이 스킬(`.agents/skills/**/SKILL.md`)인 경우, 아래 필수 섹션을 순번대로 점검하라.

## 필수 섹션

| # | 섹션 | 요구사항 | 필수 여부 |
|---|------|---------|----------|
| 1 | YAML Frontmatter | `name`과 `description` 필드가 존재하는가? | 필수 |
| 2 | 목표 (Core Objective) | 이 스킬이 해결하는 문제가 1~2문장으로 명시되어 있는가? | 필수 |
| 3 | 발동 조건 (Trigger Conditions) | `[WHEN]`, `[REQUIREMENT]`, `[DO NOT TRIGGER]` 3가지 조건이 모두 존재하는가? | 필수 |
| 4 | 활용 도구 (Required Tools) | 사용할 시스템 도구 이름과 각 용도가 명시되어 있는가? | 필수 |
| 5 | 실행 프로토콜 (Execution Protocol) | 번호가 매겨진 단계별 절차가 존재하며, 각 단계에 Input과 Process가 명시되어 있는가? | 필수 |
| 6 | 금지 조항 (Negative Constraints) | `[DANGER]` 태그가 붙은 금지 행동이 별도 섹션으로 존재하는가? | 필수 |
| 7 | resources/ 디렉토리 | 상세 템플릿·체크리스트가 분리 저장될 경우, 본문에서 상대 경로가 명시되어 있는가? | 해당 시 필수 |

## 생성 시 Skeleton

스킬 파일을 새로 생성할 때 아래 구조를 기본 뼈대로 사용하라:

```markdown
---
name: {스킬명}
description: {1문장 설명}
---

# Skill: {스킬명} ({영문 부제})

## 📌 목표 (Core Objective)
{이 스킬이 해결하는 문제를 1~2문장으로 명시}

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: {발동 트리거를 명령문으로 명시}
- **[REQUIREMENT]**: {필수 Input 조건}
- **[DO NOT TRIGGER]**: {발동하지 말아야 할 상황}

## 🛠️ 활용 도구 (Required Tools)
- `{도구명}`: {용도}

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 1단계: {단계명}
- **Input:** {입력}
- **Process:** {처리 절차}

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] {금지 행동}
```
