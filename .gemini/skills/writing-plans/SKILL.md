---
name: writing-plans
description: "다중 단계 작업에 대한 설계안(Spec)이나 요구사항이 있을 때, 실제 코드를 작성하기 전에 세부 구현 계획을 수립하기 위해 사용합니다."
---

# 구현 계획 작성하기 (Writing Plans)

## 개요 (Overview)

엔지니어가 우리 코드베이스에 대한 컨텍스트가 전혀 없고 약간은 부족한 감각을 가졌다고 가정하고, 포괄적이고 정밀한 구현 계획을 작성합니다. 각 작업을 위해 어떤 파일을 수정해야 하는지, 필요한 코드, 테스트, 참고해야 할 문서, 그리고 어떻게 테스트할지 등 알아야 할 모든 것을 문서화합니다. 전체 계획을 작게 쪼갠 'Bite-sized' Task 단위로 제공해야 합니다. DRY(Don't Repeat Yourself), YAGNI(You Aren't Gonna Need It), TDD(Test-Driven Development), 잦은 커밋(Frequent commits) 원칙을 준수하세요.

엔지니어가 숙련된 개발자이긴 하지만, 우리의 도구 모음이나 도메인 문제에 대해서는 거의 모른다고 가정하세요. 좋은 테스트 설계 방법도 잘 모른다고 가정하세요.

**시작 시 알림:** "구현 계획을 수립하기 위해 `writing-plans` 스킬을 사용합니다." (I'm using the writing-plans skill to create the implementation plan.)

**저장 경로:** `~/.track/{project_name}/plans/YYYY-MM-DD-<feature-name>.md`
- (현재 작업 경로명을 기반으로 `{project_name}` 추출)

## 스코프 점검 (Scope Check)

만약 Spec 문서가 서로 독립적인 여러 서브 시스템을 다루고 있다면, 브레인스토밍 단계에서 이미 분할되었어야 합니다. 그렇지 않았다면 지금이라도 서브 시스템별로 여러 개의 개별 Plan으로 나누는 것을 제안하세요. 각각의 Plan은 그 자체로 동작하고 테스트 가능한 소프트웨어를 산출해야 합니다.

## 파일 구조 (File Structure)

Task를 정의하기 전에, 어떤 파일이 생성되거나 수정될지, 그리고 각 파일의 책임이 무엇인지 매핑하세요.

- 명확한 경계와 잘 정의된 인터페이스를 갖춘 단위를 설계하세요. 각 파일은 명확히 하나의 책임을 가져야 합니다.
- 함께 변경되는 파일은 함께 있어야 합니다. 기술 계층(Technical layer)이 아닌 책임(Responsibility)에 따라 분할하세요.
- 기존 코드베이스에서는 확립된 패턴을 따르십시오.

이러한 구조는 Task 분해의 기준이 됩니다.

## 극소 단위 작업 세분화 (Bite-Sized Task Granularity)

**각 단계(Step)는 하나의 행동(2~5분 분량)이어야 합니다:**
- "실패하는 테스트 작성" - step
- "실행하여 테스트가 실패하는지 확인" - step
- "테스트를 통과하게 만들 최소한의 구현 코드 작성" - step
- "테스트를 다시 실행하여 통과 확인" - step
- "커밋 (Commit)" - step

## Plan 문서 헤더 (Plan Document Header)

**모든 Plan 문서는 반드시 아래 헤더로 시작해야 합니다:**

```markdown
# [기능 이름] 구현 계획 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: 이 계획을 Task 단위로 실행하려면 `executing-plans` (또는 `subagent-driven-development`) 스킬을 사용하십시오. 단계(Step)는 진행률 추적을 위해 체크박스 (`- [ ]`) 문법을 사용합니다.

**목표 (Goal):** [무엇을 구축하는지 설명하는 단일 문장]

**아키텍처 (Architecture):** [접근 방식에 대한 2-3문장 요약]

**기술 스택 (Tech Stack):** [핵심 기술/라이브러리]

---
```

## Task 구조 (Task Structure)

````markdown
### Task N: [컴포넌트 이름]

**파일 (Files):**
- 생성 (Create): `exact/path/to/file.py`
- 수정 (Modify): `exact/path/to/existing.py:123-145`
- 테스트 (Test): `tests/exact/path/to/test.py`

- [ ] **Step 1: 실패하는 테스트 작성**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: 테스트 실행 및 실패 확인**

실행: `pytest tests/path/test.py::test_name -v`
예상 결과: "function not defined" 에러와 함께 FAIL

- [ ] **Step 3: 최소 구현 코드 작성**

```python
def function(input):
    return expected
```

- [ ] **Step 4: 테스트 실행 및 통과 확인**

실행: `pytest tests/path/test.py::test_name -v`
예상 결과: PASS

- [ ] **Step 5: 커밋 (Commit)**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Placeholder 절대 금지 (No Placeholders)

모든 Step은 엔지니어에게 필요한 실제 코드를 포함해야 합니다. 아래와 같은 패턴은 **Plan 실패**입니다. 절대 작성하지 마세요:
- "TBD", "TODO", "나중에 구현", "세부 내용 채우기"
- "적절한 에러 핸들링 추가" / "검증 로직 추가" / "엣지 케이스 처리" (코드가 없는 구두 지시)
- "위 코드에 대한 테스트 작성" (실제 테스트 코드가 없는 경우)
- "Task N과 유사함" (코드를 반복해서 적으세요. 엔지니어가 순서대로 읽지 않을 수 있습니다.)
- 코드 블록 없이 무엇을 할지만 설명하는 단계
- 어떤 Task에서도 정의되지 않은 타입, 함수, 메서드에 대한 참조

## 자체 검토 (Self-Review)

Plan 전체를 작성한 후, 신선한 시각으로 Spec 문서를 다시 보고 Plan이 그에 부합하는지 점검하세요:

**1. Spec 커버리지:** Spec의 모든 요구사항을 충족하는 Task가 존재하는지 확인합니다.
**2. Placeholder 스캔:** 위 "Placeholder 절대 금지" 섹션에 해당하는 내용이 있는지 찾아 수정합니다.
**3. 타입 일관성 (Type consistency):** 이후 Task에서 사용한 타입, 메서드 시그니처, 속성명이 이전 Task에서 정의한 내용과 정확히 일치하는지 확인합니다.

문제가 발견되면 다시 리뷰하지 말고 인라인으로 즉시 수정하세요.

## 실행 인계 (Execution Handoff)

Plan 저장을 완료한 후, 사용자에게 실행 방식을 선택하도록 제안합니다:

**"Plan 작성이 완료되어 `~/.track/{project_name}/plans/<filename>.md` 에 저장되었습니다. 두 가지 실행 옵션이 있습니다:**

**1. Subagent-Driven (권장)** - 각 Task마다 새로운 하위 에이전트를 파견하여 빠르게 반복 개발합니다.
**2. Inline Execution** - 현재 세션에서 `executing-plans` 스킬을 사용하여 배치 단위로 순차 실행합니다.

**어떤 방식을 선택하시겠습니까?"**