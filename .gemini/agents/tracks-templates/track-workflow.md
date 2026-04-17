# Track Management Protocol

AI 에이전트가 작업 트랙을 생성·관리·완료하는 프로토콜.

## Rule 1: 워크플로우 7단계 (Phases)
트랙 생명주기는 아래 7단계를 따른다. 상태 전환 시 에이전트 응답 최상단에 마크다운 인용구(`>`)로 컨텍스트 헤더를 반드시 노출하라.
형식: `> 🎯 목표: [목표] | 🔄 상태: 브레인 스토밍 > 계획 작성 중 > 트랙 생성 중 > 기능 구현 > 리뷰 > 테스트 > 최종 확인`
1. **브레인 스토밍 (Brainstorming)**
2. **계획 작성 중 (Planning)**
3. **트랙 생성 중 (Creating Track)**
4. **기능 구현 (Implementation)**
5. **리뷰 (Review)**
6. **테스트 (Testing)**
7. **최종 확인 (Final Verification)**

## Rule 2: 트랙 분류 및 생성
- 작업 지시 수신 시 기존 트랙 디렉토리를 검색하라.
- 기존 트랙의 `plan.md` 목표(Goal)가 동일한 도메인/기능을 다루면 연속 작업으로 분류하라. 판단이 애매하면 사용자에게 확인하라.
- 연속 작업인 경우: `audit.md`에 새 지시를 추가하고 `plan.md` status를 `진행 중`으로 갱신하라.
- 신규 작업인 경우: `tracks/YYYY-MM/DD_HHMM_{핵심-내용}/` 디렉토리를 생성하라.
  - `YYYY-MM`은 작업 지시 시점의 연-월 디렉토리. 없으면 생성하라.
  - `DD_HHMM`은 일_시분 (예: `tracks/2026-02/25_1421_agent-ssot-migration`)
  - `{핵심-내용}`은 kebab-case 영어로 작성한다.
- 작업 시작 전 `tracks/DECISIONS.md`를 먼저 읽어 기존 프로젝트 결정을 숙지하라. 파일이 없으면 SKIP.

## Rule 3: '계획 작성 중' 상세화 프로토콜 (TDD 단위 계획)
- `plan.md`와 `todos/` 문서를 작성할 때는 극도로 상세해야 한다. 추상적인 Placeholder("TBD", "적절히 처리")는 절대 사용 금지.
- **작업 단위 (Bite-sized):** 각 세부 작업(`todos/{번호}-{작업명}.md`)은 TDD 사이클(2~5분 분량) 단위로 작성되어야 한다.
  - Step 1: 실패하는 테스트 작성 (정확한 파일 경로, 코드 블록)
  - Step 2: 테스트 실행 및 실패 확인 (예상 쉘 명령어)
  - Step 3: 최소 구현 코드 작성 (정확한 수정 파일 경로 및 변경 코드)
  - Step 4: 테스트 실행 및 통과 (예상 쉘 명령어)
  - Step 5: Git Commit (커밋 명령어)

## Rule 4: 필수 파일 생성
- 새 트랙 생성 시 아래 파일들을 생성하라:
  - `plan.md`: 필수. [.gemini/agents/tracks-templates/plan-template.md](.gemini/agents/tracks-templates/plan-template.md) 참조
  - `audit.md`: 필수. [.gemini/agents/tracks-templates/audit-template.md](.gemini/agents/tracks-templates/audit-template.md) 참조
  - `strategy.md`: 선택. 기술적 결정 및 근거 기록
  - `notes/`: 선택. 발견 사항 및 구현 노트
  - `todos/`: 선택. 세부 체크리스트(TDD 단위 작업 파일들)

## Rule 5: 월별 Status 갱신
- 새 트랙 생성 시: `tracks/YYYY-MM-status.md`에 항목 추가 (상태: `미착수`)
- 트랙 재개 시 → 상태가 `미착수`이면 `진행 중`으로 변경
- 상태 값: `진행 중`, `✅ 완료`, `미착수`, `⏸️ 보류`

## Rule 6: 결정 기록 분류
- 프로젝트 아키텍처 변경: `tracks/decisions/ADR-NNN.md` + `tracks/DECISIONS.md` 인덱스
- 트랙 내 결정: `tracks/{트랙}/strategy.md`

## Rule 7: 발견 항목 처리
- blocking(필수): `plan.md` 항목 추가 (승인 필요)
- non-blocking(비필수): `notes/discovered.md` 기록

## Rule 8: '리뷰' 다각적 분석 프로토콜 (Grill-me 방식)
- 기능 구현 후 '리뷰' 단계에 진입하면, 에이전트는 아래 3가지 기준의 **다각적 영향 리포트**를 제시하라:
  1) 의존성 충돌: 변경으로 영향을 받는 모듈/파일
  2) 아키텍처 일관성: 기존 설계 패턴(`DECISIONS.md`) 위반 여부
  3) 예상 부작용 (Side-effects): 엣지 케이스 및 위험 요소
- 리포트 제시 직후, 분석 결과 중 잠재 위험이 가장 높은 1~2개 요소에 대해 **사용자에게 날카로운 질문(Grill-me)을 던져라**.
- 사용자의 충분한 논의와 명시적 승인이 있어야만 '테스트' 단계로 넘어갈 수 있다.

## Rule 9: 트랙 생성 및 종료 Output
- 생성/완료 시: [.gemini/agents/tracks-templates/output-template.md](.gemini/agents/tracks-templates/output-template.md) 템플릿 양식으로 출력.
- plan.md의 모든 체크박스 완료 시 사용자 승인 요청. 승인 후 `✅ 완료` 처리.
- `plan.md`에 **실행 워크플로우**(사용자 요구 등 변화 반영 실제 흐름) 기록.

## Rule 10: 구 구조 마이그레이션
- `tracks/YYYY-MM-DD_HHMM_*` 구조 감지 시 `tracks/YYYY-MM/DD_HHMM_{트랙명}/`으로 이동 및 갱신.

## 금지 조항 (Negative Constraints)
- [DANGER] 사용자 승인 없이 기존 트랙의 plan.md를 수정하지 마라.
- [DANGER] discovered 항목을 todos/에 넣지 마라. notes/discovered.md 전용이다.
- [DANGER] 트랙 완료 기준을 plan.md 외 항목으로 확장하지 마라.
- [DANGER] 트랙 디렉토리 외부의 파일을 트랙 관리 목적으로 수정하지 마라.