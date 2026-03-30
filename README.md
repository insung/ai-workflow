# ai-workflow

AI 에이전트를 활용한 범용 작업 워크플로우 도구 모음.

리서치 → 분류 → 룰 생성 → 감사의 파이프라인과 작업 트랙 관리를 제공한다.

## 에이전트

| 에이전트 | 역할 | 스킬 |
|----------|------|------|
| `researcher` | 웹 리서치 수행, 원문 보존 덤프 | `research` |
| `doc-indexer` | 마크다운 문서군 카테고리화, INDEX.md 생성 | `doc-index` |
| `doc-auditor` | 지시 문서(룰/스킬/에이전트) 검증 및 룰 생성 | `doc-audit` |
| `track-agent` | 작업 트랙 생성·관리·완료 | tracks-templates |

## 파이프라인 예시

```
researcher → doc-indexer → doc-auditor
(리서치)     (분류)        (룰 생성)
```

1. `researcher`로 특정 주제를 다각도 리서치
2. `doc-indexer`로 리서치 결과를 카테고리화
3. `doc-auditor`로 문서 기반 코딩 컨벤션/룰 생성

## 디렉토리 구조

```
.agents/
├── researcher.md
├── doc-indexer.md
├── doc-auditor.md
├── track-agent.md
├── tracks-templates/       # track-agent용 템플릿
└── skills/
    ├── research/
    ├── doc-index/
    └── doc-audit/
```

## 사용 방법

이 프로젝트 디렉토리에서 Antigravity 또는 Gemini CLI를 실행하면 `.agents/`의 에이전트를 자동 인식한다.
