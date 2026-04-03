---
name: readme-craft
description: 프로젝트 유형을 판별하여 해당 유형에 최적화된 README.md를 생성하는 스킬.
---

# Skill: readme-craft (README.md Generator)

## 📌 목표 (Core Objective)
프로젝트의 코드베이스를 분석하여 유형을 판별하고, 해당 유형에 최적화된 README.md를 생성한다.

## 🚀 발동 조건 (Trigger Conditions)
- **[WHEN]**: "README를 만들어라", "README를 작성해라", "README를 생성해라"라고 지시했을 때 발동하라.
- **[REQUIREMENT]**: 대상 프로젝트의 루트 디렉토리 경로가 존재해야 한다. 존재하지 않으면 사용자에게 경로를 요청하라.
- **[DO NOT TRIGGER]**: 기존 README의 오탈자 수정, 번역, 마크다운 포맷팅만 요청하는 경우에는 발동하지 마라.

## 🛠️ 활용 도구 (Required Tools)
- `list_dir`: 프로젝트 디렉토리 구조를 파악할 때 사용하라.
- `view_file`: `package.json`, `pyproject.toml`, `build.gradle.kts`, `Dockerfile`, 기존 README 등을 읽을 때 사용하라.
- `execute_command`: `git log`, `git remote` 등 프로젝트 메타 정보를 조회할 때 사용하라.
- `write_to_file`: README.md를 생성할 때 사용하라.
- `replace_file_content`: 기존 README.md를 갱신할 때 사용하라.

## ⚙️ 실행 프로토콜 (Execution Protocol)

### 1단계: 프로젝트 분석 (Project Analysis)
- **Input:** 프로젝트 루트 디렉토리 경로.
- **Process:**
  1. `list_dir`로 루트 및 1단계 하위 디렉토리를 스캔하라.
  2. 아래 파일을 `view_file`로 읽어 기술 스택을 파악하라:
     - `package.json`, `pyproject.toml`, `build.gradle.kts`, `Cargo.toml`, `go.mod` (존재하는 것만)
     - `Dockerfile`, `docker-compose.yml` (존재하는 것만)
     - 기존 `README.md` (존재하는 경우)
  3. `resources/type-detection.md`의 판별 규칙에 따라 프로젝트 유형을 결정하라.

### 2단계: 유형 확인 (Type Confirmation)
- **Process:** 판별된 유형을 사용자에게 제시하고 확인을 받아라.
- **Output Format:**
  ```
  [프로젝트 분석 결과]
  - 경로: {프로젝트 경로}
  - 판별 유형: {유형명}
  - 판별 근거: {파일명 또는 디렉토리 패턴}
  - 기술 스택: {감지된 언어/프레임워크}
  ```
- If 사용자가 유형을 변경하면 → 변경된 유형으로 진행하라.

### 3단계: README 생성 (Generation)
- **Process:**
  1. `resources/section-registry.md`에서 해당 유형의 필수/선택 섹션 목록을 읽어라.
  2. 각 섹션을 순서대로 채워라. 프로젝트에서 감지된 실제 정보를 사용하라.
  3. `resources/quality-checklist.md`의 10개 기준을 적용하여 자체 검증하라.
- **Rules:**
  - 프로젝트에서 감지할 수 없는 정보는 `<!-- TODO: ... -->` 플레이스홀더로 표시하라.
  - 코드 예시는 프로젝트의 실제 코드에서 추출하라. 존재하지 않는 코드를 생성하지 마라.
  - 배지 URL은 프로젝트의 실제 저장소 정보를 사용하라.

### 4단계: 사용자 확인 및 저장 (Review & Save)
- **Process:**
  1. 생성된 README.md 전문을 사용자에게 제시하라.
  2. 사용자 승인 후 `write_to_file`로 저장하라.
  3. 기존 README.md가 존재하면 덮어쓰기 전 `[승인 요청]`을 수행하라.

## 🛑 강력 금지 사항 (Negative Constraints)
- [DANGER] 프로젝트에 존재하지 않는 기능, 엔드포인트, 명령어를 README에 기재하지 마라.
- [DANGER] 실제 API 키, 비밀번호, 내부 URL을 README에 포함하지 마라. 플레이스홀더(`your-api-key`)를 사용하라.
- [DANGER] 사용자 승인 없이 기존 README.md를 덮어쓰지 마라.
- [DANGER] 프로젝트 코드를 수정하지 마라. README.md만 생성/수정하라.
