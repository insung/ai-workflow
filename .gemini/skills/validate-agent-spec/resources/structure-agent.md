# 오픈 스탠더드 에이전트 구조 체크리스트 (Open Standard Agent Structure Checklist)

본 체크리스트는 특정 AI CLI 플랫폼에 종속되지 않는 범용 에이전트 작성 표준을 정의한다.

## ✅ 필수 및 권장 섹션

| # | 섹션 | 요구사항 | 필수 여부 |
|---|------|---------|----------|
| 1 | YAML Frontmatter | `name`과 `description` 필드가 존재하는가? | 필수 |
| 2 | YAML Frontmatter (옵션) | `platform-specs.md`에 정의된 플랫폼별 설정이 올바르게 포함되었는가? | 선택 |
| 3 | 정체성 (Identity) | 이름과 핵심 역할이 명시되어 있는가? | 필수 |
| 4 | 행동 규약 (Operational Directives) | 모든 원칙이 단호한 명령문(~하라) 형태로 되어 있는가? | 필수 |
| 5 | 스킬 바인딩 (Skill Binding) | `{CLI_DIR}/skills/.../SKILL.md` 상대 경로가 명시되어 있는가? | 해당 시 필수 |
| 6 | 제약 사항 (Constraints) | `[DANGER]` 또는 `🛑` 키워드를 사용한 금지 조항이 존재하는가? | 필수 |

## 🏗️ 참조 리소스 (Reference Resources)
- **통합 템플릿**: `unified-agent-template.md`
- **플랫폼 명세**: `platform-specs.md`
