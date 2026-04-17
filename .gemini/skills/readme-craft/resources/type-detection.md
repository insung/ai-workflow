# 프로젝트 유형 판별 규칙 (Type Detection Rules)

아래 규칙을 순서대로 적용하라. 먼저 매칭되는 유형을 채택한다. 복수 유형에 해당하면 사용자에게 선택지를 제시하라.

## 판별 테이블

| # | 유형 | 판별 조건 (AND) |
|---|------|----------------|
| 1 | CLI Tool | `bin` 필드 in `package.json` OR `[tool.poetry.scripts]` in `pyproject.toml` OR CLI 프레임워크(click, typer, commander, yargs) 의존성 |
| 2 | Component Library | `peerDependencies`에 `react` 또는 `vue` 포함 AND `src/components/` 디렉토리 존재 AND `storybook` 의존성 존재 |
| 3 | Backend API/Service | `fastapi` OR `flask` OR `express` OR `spring-boot` 의존성 AND `routes/` 또는 `api/` 또는 `controllers/` 디렉토리 존재 |
| 4 | Web Application | `react` OR `vue` OR `next` OR `nuxt` in dependencies AND `pages/` 또는 `app/` 디렉토리 존재 AND 유형 2 조건 불충족 |
| 5 | Framework/Boilerplate | `init` 또는 `create` 또는 `scaffold` 명령어 in scripts AND `templates/` 또는 `boilerplate/` 디렉토리 존재 |
| 6 | Data Science/ML | `jupyter` OR `torch` OR `tensorflow` OR `scikit-learn` 의존성 AND `*.ipynb` 파일 존재 |
| 7 | AI Agent/Workflow | `.agents/` 디렉토리 존재 OR `skills/` 디렉토리 존재 |
| 8 | Internal/Team Project | 위 1~7 어디에도 해당하지 않는 경우 기본값 |

## 복합 유형 처리

- 프론트엔드 + 백엔드가 모노레포에 공존하면 → "Web Application (Full-Stack)"으로 판별하라.
- 판별 불가 시 → 사용자에게 유형 목록을 제시하고 선택을 받아라.
