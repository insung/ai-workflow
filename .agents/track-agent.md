# Track Management Protocol

AI 에이전트가 작업 트랙을 생성·관리·완료하는 프로토콜.

## Rule 1: 트랙 분류 및 생성
- 작업 지시 수신 시 기존 트랙 디렉토리를 검색하라.
- 기존 트랙의 `plan.md` 목표(Goal)가 동일한 도메인/기능을 다루면 연속 작업으로 분류하라. 판단이 애매하면 사용자에게 확인하라.
- 연속 작업인 경우: `audit.md`에 새 지시를 추가하고 `plan.md` status를 `진행 중`으로 갱신하라.
- 신규 작업인 경우: `tracks/YYYY-MM-DD_HHMM_{핵심-내용}/` 디렉토리를 생성하라.
  - 날짜/시간은 작업 지시 시점 기준 (예: `2026-02-25_1421_agent-ssot-migration`)
  - `{핵심-내용}`은 kebab-case 영어로 작성한다.
- 작업 시작 전 `tracks/DECISIONS.md`를 먼저 읽어 기존 프로젝트 결정을 숙지하라. 파일이 없으면 SKIP.

## Rule 2: 트랙 생성 시 필수 파일 생성
- 새 트랙 생성 시 아래 표에 따라 파일을 생성하라:

| 파일/디렉토리 | 필수 여부 | 템플릿 | 용도 |
|---------------|-----------|--------|------|
| `plan.md` | 필수 | [plan-template.md](~/.kiro/agents/tracks-templates/plan-template.md) | 체크박스 형태의 작업 목록 |
| `audit.md` | 필수 | [audit-template.md](~/.kiro/agents/tracks-templates/audit-template.md) | 사용자 지시의 시간순 기록 |
| `strategy.md` | 선택사항 | [strategy-template.md](~/.kiro/agents/tracks-templates/strategy-template.md) | 기술적 결정 및 근거 |
| `notes/` | 선택사항 | - | 공통/방대한 구현 노트 |
| `todos/` | 선택사항 | - | 세부 체크리스트 |

## Rule 3: 월별 Status 갱신
- 새 트랙 생성 시: `tracks/YYYY-MM-status.md`에 항목 추가 (상태: `미착수`)
- 트랙 재개 시 → 상태가 `미착수`이면 `진행 중`으로 변경
- 월별 status 파일이 없으면 [status-template.md](~/.kiro/agents/tracks-templates/status-template.md)로 생성하라.

**상태 값 (Status Enum):**
- `진행 중`: 현재 작업 중인 트랙
- `✅ 완료`: plan.md의 모든 체크박스 완료 후 사용자 승인된 트랙
- `미착수`: 트랙 생성했으나 아직 작업 시작 안 함
- `⏸️ 보류`: 일시 중단된 트랙

## Rule 4: 결정 기록 분류
- 프로젝트 전체 구조/아키텍처 변경: `tracks/decisions/ADR-NNN.md` + `tracks/DECISIONS.md` 인덱스
- 현재 트랙 범위 내 구현 결정: `tracks/{트랙}/strategy.md`
- 분류 애매 시: 사용자에게 "프로젝트 주요 결정 vs 트랙 내 결정" 확인 요청

## Rule 5: 발견 항목 처리
- 현재 작업 완료에 필수 (blocking): `plan.md`에 항목 추가 (사용자 승인 필요)
- 관련 있지만 비필수 (non-blocking): `notes/discovered.md`에 기록
- blocking 판단 기준: 현재 plan.md 목표 달성에 직접 영향 여부

## Rule 6: Plan 세부 작업 분해 및 파일명 규칙
- plan.md 항목이 3개 이상: 각 항목에 `todos/{번호}-{작업명}.md` 링크 생성
- todos/ 파일명은 plan.md 항목 번호와 반드시 일치
- 하위 작업 완료 시: plan.md 체크박스를 즉시 `[x]`로 갱신

## Rule 7: 트랙 생성 및 종료 Output
- 새 트랙 생성 시: "트랙 생성" 출력 템플릿 사용
- plan.md의 모든 체크박스 완료 시: 사용자에게 "트랙을 종료하시겠습니까?" 승인 요청
- 사용자 승인 시: 
  1. audit.md에 미기록된 모든 대화 및 트랙 종료 기록 추가
  2. "트랙 완료" 출력 템플릿 사용
  3. 월별 status를 `✅ 완료`로 갱신
- 출력 템플릿: [output-template.md](~/.kiro/agents/tracks-templates/output-template.md) 참조

## 금지 조항 (Negative Constraints)
- [DANGER] 사용자 승인 없이 기존 트랙의 plan.md를 수정하지 마라
- [DANGER] discovered 항목을 todos/에 넣지 마라 (notes/discovered.md 전용)
- [DANGER] 트랙 완료 기준을 plan.md 외 항목으로 확장하지 마라
- [DANGER] 월별 status 갱신 실패 시 트랙 생성을 중단하지 마라
- [DANGER] 트랙 디렉토리 외부의 파일을 트랙 관리 목적으로 수정하지 마라
