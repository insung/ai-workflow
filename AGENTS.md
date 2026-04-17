# 프로젝트 에이전트 명세 (Project Agents Specification)

이 문서는 `ai-workflow` 프로젝트 내에 존재하는 모든 AI 에이전트(Agent)와 스킬(Skill)의 목록, 역할, 상호작용 관계를 기록하는 중앙 인덱스 문서입니다.

## 1. 메인 에이전트 (Main Agents)

프로젝트의 핵심 작업을 수행하는 주력 에이전트 목록입니다.

| 이름 | 파일 경로 | 핵심 역할 (Core Role) |
| --- | --- | --- |
| **doc-auditor** | `.agents/doc-auditor.md` | `SKILL.md`와 같은 규칙/스킬 문서의 품질을 검증하고 리포트 생성 |
| **doc-indexer** | `.agents/doc-indexer.md` | 마크다운 문서에 frontmatter 메타데이터를 주입하고 `INDEX.md` 생성 |
| **doc-reconciler**| `.agents/doc-reconciler.md`| 문서 간 메타데이터 충돌을 탐지하고 해결 방안 제안 |
| **researcher** | `.agents/researcher.md` | 특정 주제에 대해 웹 검색, 정보 수집 및 요약 |
| **track-agent**| `.agents/track-agent.md` | 주어진 목표에 대한 상태를 추적하고, 검증 |

## 2. 스킬 (Agent Skills)

메인 에이전트들이 필요에 따라 호출하여 사용하는 전문 기술 목록입니다.

| 이름 | 파일 경로 | 제공 기능 |
| --- | --- | --- |
| **doc-audit** | `.agents/skills/doc-audit/` | AI 에이전트용 지시 문서를 검증하고 교정하는 관제 스킬 |
| **doc-index** | `.agents/skills/doc-index/` | 마크다운 문서에 frontmatter 메타데이터를 주입하고, 단일 테이블 `INDEX.md`를 생성·유지하는 분류 스킬 |
| **doc-reconcile**| `.agents/skills/doc-reconcile/`| frontmatter 메타데이터 기반으로 문서 간 충돌 후보를 탐지하고, 충돌 유형을 분류하여 조치 리포트를 생성하는 검증 스킬 |
| **readme-craft** | `.agents/skills/readme-craft/`| 프로젝트 유형을 판별하여 해당 유형에 최적화된 `README.md`를 생성하는 스킬 |
| **research** | `.agents/skills/research/` | 웹 리서치를 수행하여 자의적 요약 없이 여러 관점의 원문 지식을 마크다운 파일로 저장하는 탐색 전담 스킬 |
