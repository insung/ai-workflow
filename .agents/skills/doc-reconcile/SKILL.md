---
name: doc-reconcile
description: frontmatter 메타데이터 기반으로 문서 간 충돌 후보를 탐지하고, 충돌 유형을 분류하여 조치 리포트를 생성하는 검증 스킬.
---

# Skill: Document Conflict Reconciler

## 📌 목표 (Core Objective)
지정된 경로의 마크다운 문서군에서 frontmatter 메타데이터를 1차 필터로 사용하여 충돌 후보 쌍을 탐지하고, 필요 시 본문 비교를 수행하여 충돌 유형을 분류한 뒤, 조치 권고가 포함된 리포트를 생성하라.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: "문서 충돌을 검사해라", "문서 간 모순을 찾아라", "reconcile 해라"라고 지시했을 때 발동하라.
- **[REQUIREMENT]**: 대상 `*.md` 파일들에 frontmatter가 존재해야 한다. frontmatter가 없는 파일은 스킵하고 리포트에 누락 목록으로 기록한다.
- **[DO NOT TRIGGER]**: 웹 리서치, 코드 실행, 문서 생성/수정 지시에는 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
- `list_dir`: 대상 디렉토리의 `*.md` 파일 목록을 확보할 때 사용하라.
- `view_file`: frontmatter 파싱 및 본문 비교가 필요한 파일을 읽을 때 사용하라.
- `run_command`: `git log` 명령으로 파일의 최종 수정 시점을 확인할 때 사용하라.
- `write_to_file`: 리포트 파일을 생성할 때 사용하라.

## ⚙️ 실행 프로토콜 (Execution Protocol)

### Phase 1: 메타데이터 수집

1. `list_dir`로 대상 경로의 모든 `*.md` 파일 목록을 확보한다 (INDEX, _index, README 제외).
2. 각 파일의 frontmatter만 읽는다 (본문은 읽지 않는다).
3. frontmatter가 없는 파일은 `no_frontmatter` 목록에 기록하고 이후 분석에서 제외한다.
4. 파일별로 다음 필드를 추출한다 (필드명은 프로젝트마다 다를 수 있으므로 유연하게 매핑):

| 용도 | 우선 필드명 | 대체 필드명 |
|------|-----------|-----------|
| 카테고리 | `category` | 디렉토리명으로 추론 |
| 키워드 | `keywords` | `tags` |
| 요약 | `summary` | `title` |
| 상태 | `status` | 없으면 `unknown` |
| 최종 수정 | `last_updated` | `date`, git log fallback |
| 관계 선언 | `related_docs` | `related`, `supersedes` |
| 우선순위 | `priority` | 없으면 `medium` |
| 타입 | `type` | 없으면 파일명에서 추론 |

### Phase 2: 충돌 후보 탐지 (메타데이터 전용, 본문 미참조)

3단계 필터를 순차 적용한다. 각 단계에서 플래그된 쌍은 `candidate_pairs` 목록에 추가한다.

**필터 1: 구조적 겹침 (category × type)**
- 동일 `category` + 동일 `type`인 파일 쌍을 플래그한다.
- 신뢰도: `HIGH`

**필터 2: 키워드 교집합 (Jaccard 유사도)**
- 모든 파일 쌍의 `keywords` Jaccard 유사도를 계산한다.
  ```
  J(A, B) = |A ∩ B| / |A ∪ B|
  ```
- 임계값: J ≥ 0.4 → 플래그.
- 동일 category 내 쌍은 임계값을 J ≥ 0.3으로 낮춘다.
- 신뢰도: J ≥ 0.6 → `HIGH`, J ≥ 0.4 → `MEDIUM`

**필터 3: 의도적 중복 패턴 감지**
- `{주제}.md` + `{주제}-guide.md` 쌍을 감지한다.
- `related_docs`에 서로를 참조하는 쌍을 감지한다.
- 이 쌍들은 `intentional_overlap`으로 분류한다 (충돌이 아닌 동기화 대상).

### Phase 3: 충돌 유형 분류 (본문 참조, 후보 쌍만)

Phase 2에서 탐지된 `candidate_pairs`에 대해서만 본문을 읽고 분류한다.

**분류 기준 (6가지 유형):**

| 유형 | 코드 | 판단 기준 | 조치 |
|------|------|----------|------|
| 동일 주제 중복 | `DUPLICATE` | 같은 정보를 다른 파일에서 반복 | 하나로 통합하거나 참조로 대체 |
| 수치/사실 불일치 | `FACTUAL` | 숫자, 날짜, 이름 등 구체적 사실이 다름 | 원본 확인 후 한쪽 수정 |
| 절차 불일치 | `PROCESS` | 같은 작업의 절차/순서가 다르게 기술 | 정본 확정 후 동기화 |
| 범위 불일치 | `SCOPE` | 한쪽은 전체, 다른 쪽은 부분만 기술 | 범위 명시 또는 참조 추가 |
| 시간적 불일치 | `STALE` | 한쪽이 업데이트되었으나 다른 쪽은 구버전 유지 | 구버전 파일 업데이트 |
| 의도적 관점 분리 | `INTENTIONAL` | 개발자용/기획자용 등 의도적 분리 | 동기화 체크만 필요 |

**분류 방법:**
1. 후보 쌍의 본문에서 겹치는 섹션(H2 제목 기준)을 식별한다.
2. 겹치는 섹션의 핵심 문장을 비교한다.
3. `last_updated` 차이가 30일 이상이면 `STALE` 가능성을 우선 검토한다.
4. `{주제}.md` + `{주제}-guide.md` 쌍은 `INTENTIONAL`로 우선 분류하되, 사실 불일치가 있으면 `FACTUAL`로 승격한다.

### Phase 4: 리포트 생성

대상 디렉토리에 `RECONCILE-REPORT.md`를 생성한다.

```markdown
# Reconcile Report

**대상**: {경로}
**검사 일시**: {timestamp}
**총 파일**: {N}개 (frontmatter 있음: {M}개, 없음: {K}개)

## 충돌 요약

| # | 파일 A | 파일 B | 유형 | 신뢰도 | 조치 |
|---|--------|--------|------|--------|------|
| 1 | {path} | {path} | {type_code} | {HIGH/MEDIUM} | {권고 조치} |

## 상세

### 충돌 #1: {파일A} ↔ {파일B}
- **유형**: {유형 설명}
- **근거**: {겹치는 섹션명}, {구체적 불일치 내용 인용}
- **권고**: {조치 방안}

## Frontmatter 누락 파일
- {파일 목록}

## 동기화 대상 (의도적 중복)
| 파일 A | 파일 B | 마지막 동기화 간격 |
|--------|--------|------------------|
| {path} | {path} | {일수}일 |
```

### Phase 5: 자동 조치 실행 + 수동 조치 제안

Phase 3에서 분류된 충돌 유형에 따라, 안전한 범위의 메타데이터만 자동 갱신하고 나머지는 리포트에 제안으로 남긴다.

**자동 실행 (본문 수정 없음, frontmatter만 갱신):**

1. **오래된 문서 표시 (STALE)**
   - 같은 주제를 다루는 문서 쌍에서 `last_updated` 차이가 30일 이상이면, 오래된 쪽의 `status`를 `outdated`로 변경한다.
   - 새 문서의 `supersedes` 필드에 구 문서 경로를 추가한다.

2. **관련 문서 연결 (모든 충돌 유형)**
   - 충돌 후보로 탐지된 모든 쌍의 `related` 필드에 서로를 추가한다 (이미 있으면 스킵).

3. **의도적 중복 기록 (INTENTIONAL)**
   - `{주제}.md` + `{주제}-guide.md` 쌍의 `related` 필드를 상호 연결한다.
   - 동기화 간격(두 파일의 `last_updated` 차이)을 리포트에 기록한다.

**수동 조치 제안 (리포트에 기록, 사용자 판단 대기):**

`FACTUAL`, `DUPLICATE`, `PROCESS`, `SCOPE` 유형은 자동 수정하지 않는다. 리포트에 다음을 포함한다:
- 충돌하는 양쪽 섹션명과 원문 인용
- 권고 조치 (예: "파일 A의 3번 섹션 수치를 파일 B에 맞춰 수정 필요")
- 사용자가 다음 지시를 내릴 수 있도록 구체적 경로와 라인 정보

### 핸드오버

아래 Skeleton으로 반환하라. 리포트 전문을 채팅창에 출력하지 마라.

```
[완료 보고]
- 대상: {경로}
- 총 파일: {N}개
- Frontmatter 누락: {K}개
- 충돌 후보: {C}쌍
- 충돌 확정: {D}쌍 (DUPLICATE: {n}, FACTUAL: {n}, PROCESS: {n}, SCOPE: {n}, STALE: {n})
- 의도적 중복: {I}쌍
- 자동 조치: {A}건 (outdated 표시: {n}, supersedes 설정: {n}, related 갱신: {n})
- 수동 조치 필요: {M}건 (리포트 참조)
- 리포트: {경로}/RECONCILE-REPORT.md
```

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] Phase 5의 자동 조치 범위를 벗어나는 원본 파일 수정을 하지 마라. 본문은 절대 수정하지 않는다. frontmatter 필드(`status`, `supersedes`, `related`)만 갱신을 허용한다.
- [DANGER] Phase 2를 건너뛰고 모든 파일의 본문을 비교하지 마라. 메타데이터 필터링이 반드시 선행되어야 한다.
- [DANGER] 충돌 유형을 근거 없이 판정하지 마라. 리포트의 모든 충돌 항목에는 [섹션명]과 [원문 인용]을 근거로 포함해야 한다.
- [DANGER] `INTENTIONAL` 유형을 충돌로 에스컬레이션하지 마라. 사실 불일치가 동반된 경우에만 승격한다.
- [DANGER] frontmatter 필드명을 하드코딩하지 마라. Phase 1의 매핑 테이블에 따라 유연하게 처리한다.

## 📐 성능 제약 (Performance Constraints)
- Phase 2의 Jaccard 계산은 O(n²)이지만, 파일 수 100개 이하에서는 문제없다.
- Phase 3의 본문 비교는 후보 쌍에만 적용하므로, 전체 파일 수가 아닌 후보 쌍 수에 비례한다.
- 파일 수 100개 초과 시: Phase 2에서 동일 category 내 쌍만 비교하도록 스코프를 축소한다.
