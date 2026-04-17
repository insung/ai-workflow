---
name: research
description: 웹 리서치를 수행하여 자의적 요약 없이 여러 관점의 원문 지식을 마크다운 파일로 저장하는 탐색 전담 스킬.
---

# Skill: Explicit Fetcher & Researcher

## 📌 목표 (Core Objective)
사용자의 Query를 N개의 다각도 검색어로 분리하고, 원문 정보를 요약하거나 훼손하지 않은 채 지정된 위치에 마크다운(`*.md`) 파일들로 덤프(Dump)한다.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: 사용자가 인터넷이나 웹을 검색하여 기초 정보, 베스트 프랙티스, 트러블슈팅 사례 등을 리서치해 달라고 지시할 때 트리거.
- **[REQUIREMENT]**: 발동 시 탐색 결과를 저장할 명확한 로컬 디렉토리(예: `workspace/research/`) 공간이 확보되어 있어야 한다.
- **[DO NOT TRIGGER]**: 이미 로컬 시스템에 존재하는 파일들을 합치거나 룰을 분석하라는 지시에는 절대 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
이 스킬을 실행하기 위해 반드시 다음 도구를 활용하십시오.
- `search_web`: 주어진 키워드를 통해 인터넷 정보를 스크래핑할 때 사용.
- `read_url_content`: 검색으로 찾은 지정된 URL 원문의 텍스트 및 코드 블록을 추출할 때 사용.
- `write_to_file`: 덤프한 데이터를 가공 없이 로컬 디렉토리에 마크다운 코드로 직접 기록할 때 사용.

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 1단계: 쿼리 분해 (Decompose Query)
- **Input:** 사용자의 단일 목표 (Target Topic, 예: Jenkins Groovy Pipeline)
- **Process:** 목표 대상을 반드시 4가지 관점의 하위 쿼리로 나눈다.
  1. `[Target Topic] 기본 구조 및 문법 기초`
  2. `[Target Topic] 실무 베스트 프랙티스 (모범 사례)`
  3. `[Target Topic] 안티 패턴 및 워스트 프랙티스 (실패 사례)`
  4. `[Target Topic] 실제 코드 기반 예외 처리 또는 트러블슈팅`
- **Output:** 4개의 별도 검색 키워드 배열

### 2단계: 순차 검색 및 추출 (Sequential Fetching)
- **Process:** 분해된 4개의 쿼리를 각각 웹 검색(`search_web`) 시스템에 던진다. 
- **Requirement:** 쿼리 당 상위 2~3개의 양질의 링크 내용을 읽어들인다(`read_url_content`).

### 3단계: 원형 보존 및 파일링 (Preservation & Filing)
- **Process:** 각 쿼리 결과물 별로 새로운 파일을 생성한다.
- **Rules:** 
  - 서론 결론을 만들지 않는다.
  - 리서치된 본문과 `<code>` 블록을 **절대 요약(Summarize)하거나 수정하지 말고** 원문 그대로 복사하여 저장한다.
- **Output:** `workspace/research/` 디렉토리에 4개의 파일을 생성한다.
  - `workspace/research/<topic>-basics.md`
  - `workspace/research/<topic>-best-practices.md`
  ...

### 4단계: 반환 및 리포트 (Handover)
- **Output Constraint:** 메인 에이전트에게 **결과 요약을 절대 텍스트로 전달하지 말 것.**
- **Format:** 완료 브리핑 시 오직 생성된 **[디렉토리 경로 및 파일 이름의 리스트(Array)]** 만 반환하라.

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] 수집된 문서를 읽고 사용자를 위해 친절하게 "요약해서" 리포트하지 마라.
- [DANGER] 불완전한 링크나 데이터를 억지로 상상해서 채워 넣지 마라.
