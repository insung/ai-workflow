# AI Workflow

AI 에이전트를 활용한 범용 작업 워크플로우 도구 모음입니다. 리서치부터 분류, 룰 생성 및 감사, 그리고 트랙 기반의 작업 관리까지 일관된 파이프라인을 제공합니다.

## 🤖 프로젝트 에이전트 (Agents)

이 프로젝트는 특정 도메인의 지식을 수집하고 구조화하는 데 최적화된 에이전트들을 포함하고 있습니다.

| 에이전트 | 핵심 역할 | 파일 경로 |
| :--- | :--- | :--- |
| **track-agent** | 7단계 생명주기 기반의 작업 트랙 생성·관리·완료 | `.gemini/agents/track-agent.md` |
| **researcher** | 특정 주제에 대한 웹 검색 및 원문 데이터 수집 | `.gemini/agents/researcher.md` |
| **doc-indexer** | 마크다운 문서 메타데이터 주입 및 `INDEX.md` 생성 | `.gemini/agents/doc-indexer.md` |
| **doc-auditor** | 지시 문서(룰/스킬)의 품질 검증 및 리포트 생성 | `.gemini/agents/doc-auditor.md` |
| **doc-reconciler** | 문서 간 데이터 충돌 탐지 및 해결 방안 제안 | `.gemini/agents/doc-reconciler.md` |

## 🛠️ 전문 스킬 (Skills)

에이전트들이 복잡한 작업을 수행하기 위해 호출하는 전문 기능 모듈입니다.

| 스킬 | 주요 기능 | 파일 경로 |
| :--- | :--- | :--- |
| **research** | 자의적 요약 없이 여러 관점의 원문 지식을 보존하며 리서치 수행 | `.gemini/skills/research/` |
| **doc-index** | 문서 카테고리화 및 단일 테이블 형태의 인덱스 유지 관리 | `.gemini/skills/doc-index/` |
| **doc-audit** | AI 에이전트용 지시 문서를 기계적 로직으로 교정 및 관제 | `.gemini/skills/doc-audit/` |
| **doc-reconcile** | frontmatter 기반의 문서 충돌 분류 및 조치 리포트 생성 | `.gemini/skills/doc-reconcile/` |
| **readme-craft** | 프로젝트 유형에 최적화된 고품질 `README.md` 생성 | `.gemini/skills/readme-craft/` |

## 🔄 파이프라인 (Pipelines)

```text
researcher → doc-indexer → doc-auditor
(정보 수집)   (분류/구조화)  (룰/지침 생성)
```

1. **리서치:** `researcher`를 통해 특정 주제에 대한 방대한 데이터를 수집합니다.
2. **구조화:** `doc-indexer`가 수집된 문서를 분류하고 전체 인덱스를 생성합니다.
3. **룰 생성:** `doc-auditor`가 구조화된 데이터를 기반으로 즉시 실행 가능한 코딩 룰이나 가이드를 도출합니다.

## 📂 디렉토리 구조

```text
.gemini/
├── agents/             # 메인 에이전트 정의
├── skills/             # 전문 스킬 모듈
├── tracks-templates/   # track-agent용 워크플로우 템플릿
└── workflows/          # 고수준 작업 파이프라인 정의
```

## 🚀 사용 방법

1. Gemini CLI 또는 호환되는 AI 에이전트 도구를 실행합니다.
2. 에이전트는 `.gemini/` 디렉토리의 설정을 자동으로 인식하여 사용자 지시에 따라 작업을 수행합니다.
3. 작업 관리가 필요한 경우 `track-agent`를 호출하여 체계적인 워크플로우를 시작하세요. (상세 안내: `docs/TRACK_AGENT_GUIDE.md`)
