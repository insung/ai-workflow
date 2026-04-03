---
name: doc-index
description: 마크다운 문서에 frontmatter 메타데이터를 주입하고, 단일 테이블 INDEX.md를 생성·유지하는 분류 스킬.
---

# Skill: Metadata-First Index Architect

## 📌 목표 (Core Objective)
지정된 경로의 마크다운 문서군을 분석하여 각 파일에 YAML frontmatter 메타데이터를 주입하고, 전체 파일을 단일 테이블로 참조하는 INDEX.md를 생성·유지하라.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: "문서를 정리해라", "인덱스를 만들어라", "frontmatter를 추가해라", "카테고리를 재구성해라"라고 지시했을 때 발동하라.
- **[REQUIREMENT]**: 대상 `*.md` 파일들이 로컬 디렉토리에 존재해야 한다. 존재하지 않으면 사용자에게 경로를 요청하라.
- **[DO NOT TRIGGER]**: 웹 리서치, 코드 실행, 룰·스킬 생성 지시에는 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
- `list_dir`: 대상 디렉토리의 `*.md` 파일 목록을 확보할 때 사용하라.
- `view_file`: 각 파일의 내용을 읽어 주제를 파악할 때 사용하라.
- `write_to_file`: INDEX.md를 신규 생성할 때 사용하라.
- `replace_file_content`: 기존 INDEX.md를 갱신하거나 파일에 frontmatter를 삽입할 때 사용하라.

## ⚙️ Frontmatter 스키마

각 md 파일 상단에 아래 YAML frontmatter를 삽입한다. 필드 수: 8개.

```yaml
---
category: string             # 소속 카테고리 (복수면 리스트: [cat1, cat2])
type: string                 # basics | best-practices | anti-patterns | troubleshooting | comparison | guide | deep-dive
tags: [string, string, ...]  # 검색용 키워드 3-5개
summary: string              # 1문장 요약 (40자 이내)
status: string               # draft | reviewed | outdated
version: string              # 최종 수정 git commit SHA (short hash, 7자)
supersedes: [string, ...]    # 이 문서가 대체하는 문서의 상대 경로 목록
related: [string, ...]       # 같은 주제를 다른 관점에서 다루는 문서의 상대 경로 목록
---
```

### 필드 규칙
- `category`: 카테고리명은 kebab-case로 통일한다 (예: `jenkins-groovy`, `kiro-cli-multi-agent`).
- `type`: 위 7개 값 중 하나만 사용한다. 해당 없으면 가장 가까운 값을 선택한다.
- `tags`: 3개 미만이면 부족, 5개 초과면 과다. 3-5개를 유지한다.
- `summary`: INDEX.md 테이블의 요약 컬럼에 그대로 사용된다. 40자를 초과하지 않는다.
- `status`: 신규 생성 시 `draft`. 사용자가 검토 완료 시 `reviewed`. 6개월 이상 미갱신 시 `outdated`.
- `version`: `git log -1 --format=%h -- {파일경로}` 명령으로 해당 파일의 최신 커밋 short SHA를 조회한다. git 이력이 없으면 `untracked`으로 표기한다.
- `supersedes`: 이 문서가 완전히 대체하는 구 문서의 상대 경로. 해당 없으면 빈 리스트 `[]`. 대체 대상 문서의 `status`는 `outdated`로 갱신한다.
- `related`: 동일 주제를 다른 관점(개발자용/기획자용, basics/deep-dive 등)에서 다루는 문서의 상대 경로. 해당 없으면 빈 리스트 `[]`. doc-reconciler가 동기화 검증에 활용한다.

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 모드 판별
- If 대상 디렉토리에 INDEX.md가 존재하지 않으면 → **모드 A**(초기 구축)를 실행하라.
- If INDEX.md가 존재하면 → **모드 B**(증분 갱신)를 실행하라.
- If 사용자가 "재구성"을 명시적으로 지시하면 → INDEX.md 존재 여부와 무관하게 **모드 A**를 실행하라.

---

### 모드 A: 초기 구축

**Phase 1: 전수 스캔 및 Frontmatter 주입**

1. `list_dir`로 모든 `*.md` 파일 목록을 확보한다 (INDEX.md 자체는 제외).
2. 각 파일을 `view_file`로 읽는다.
3. 파일에 YAML frontmatter(`---` ~ `---`)가 이미 존재하면 → 스킵한다.
4. frontmatter가 없으면 → 파일 내용을 분석하여 스키마에 맞는 frontmatter를 생성하고, 파일 최상단에 삽입한다.
5. `version` 필드는 `git log -1 --format=%h -- {파일경로}` 명령으로 조회한다.

**Phase 2: 택소노미 설계**

1. 모든 파일의 frontmatter `category` 값을 수집한다.
2. 공통 주제를 기준으로 카테고리 그룹을 도출한다.
3. `resources/category-health.md`의 4개 기준을 적용하여 구조를 검증한다.
4. 기준 미충족 시 카테고리를 분할 또는 병합하여 재설계한다.
5. 카테고리 변경이 발생하면 해당 파일의 frontmatter `category` 값도 갱신한다.

**Phase 3: INDEX.md 생성**

아래 Skeleton으로 단일 테이블 INDEX.md를 작성한다:

```markdown
# INDEX

| 카테고리 | 파일 | 타입 | 태그 | 요약 |
|---------|------|------|------|------|
| {category} | [{파일명}]({상대 경로}) | {type} | {tags 콤마 구분} | {summary} |

---
**메타:** {카테고리 수}개 카테고리 / {총 파일 수}개 파일 / {생성 일시}
```

테이블 규칙:
- 각 파일은 테이블에 **1행만** 차지한다. 복수 카테고리는 카테고리 컬럼에 콤마로 표기한다.
- 카테고리 컬럼 기준으로 알파벳 정렬한다.
- 모든 컬럼 값은 해당 파일의 frontmatter에서 읽어온다.

**Phase 4: 완전성 검증**

- 모든 입력 `*.md` 파일이 INDEX.md 테이블에 1행으로 등재되어 있는지 확인한다.
- 미등재 파일 발견 시 누락 파일을 명시하고 보정한다.

---

### 모드 B: 증분 갱신

**1단계: 변경 감지**
- 기존 INDEX.md의 등록 파일 목록과 현재 디렉토리 파일 목록을 대조하여 신규·삭제 파일을 식별한다.

**2단계: 신규 파일 Frontmatter 주입**
- 신규 파일을 `view_file`로 읽고, frontmatter가 없으면 Phase 1의 절차(모드 A 3-5번)에 따라 주입한다.
- 기존 파일 중 frontmatter가 없는 파일도 이 단계에서 보정한다.

**3단계: 신규 파일 분류**
- 신규 파일의 frontmatter `category`를 기존 카테고리와 대조한다.
- 적합한 카테고리가 없으면 신규 카테고리 생성을 사용자에게 제안한다.

**4단계: 건강성 검사**
- `resources/category-health.md`의 4개 기준을 적용한다.
- 미충족 카테고리 존재 시 재구조화 제안을 사용자에게 보고하고 승인을 대기한다.

**5단계: INDEX.md 갱신**
- 변경 사항을 반영하고 완전성 검증(모드 A Phase 4)을 실행한다.

---

### 핸드오버

아래 Skeleton으로 반환하라. INDEX.md 전문을 채팅창에 출력하지 마라.

```
[완료 보고]
- 실행 모드: {A: 초기 구축 | B: 증분 갱신}
- INDEX 경로: {경로}
- 카테고리: {N}개
- 총 파일: {M}개
- Frontmatter 주입: {신규 N개 / 스킵 M개}
- 건강성: {PASS | WARN(사유)}
```

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] 원본 파일의 **본문**을 수정·삭제하지 마라. frontmatter 블록(`---` ~ `---`)만 삽입·갱신을 허용한다.
- [DANGER] 외부 인터넷을 검색하여 카테고리를 구성하지 마라. 주어진 파일만으로 분류하라.
- [DANGER] 파일 내용을 INDEX.md에 복사하지 마라. frontmatter의 summary 값과 참조 링크만 기록하라.
- [DANGER] frontmatter 필드를 스키마에 정의된 8개 외로 임의 추가하지 마라.
