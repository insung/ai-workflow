---
name: code-comments
description: Obsidian Tandem Comments와 VS Code Comments의 열린 코멘트를 작업공간과 여러 Git 저장소에서 찾아 읽고 답글이나 새 코멘트를 작성하는 Codex Skill. 사용자가 "코멘트 확인해줘", "옵시디언 코멘트", "VS Code 코멘트", "코드에 코멘트 달아줘"라고 하거나 `tandem-comments` 또는 `.comments/threads` 형식이 있으면 사용한다.
---

# Code Comments

Obsidian 문서와 VS Code 코드에 남긴 코멘트를 하나의 진입점에서 처리한다. 두 형식의 저장 방식은 섞지 않고, 공통 대화 규칙만 함께 적용한다.

## 형식 판별

1. 사용자가 Obsidian 또는 Tandem Comments를 명시했거나 대상 Markdown에 `tandem-comments` 블록이나 `.comments/tandem/threads/*.jsonl` 기록이 있으면 [obsidian.md](references/obsidian.md)를 읽고 적용한다.
2. 사용자가 VS Code Comments를 명시했거나 대상 저장소에 `.comments/threads/*.jsonl`이 있으면 [vscode.md](references/vscode.md)를 읽고 적용한다.
3. 사용자가 형식을 명시하지 않고 "코멘트 확인해줘"라고 하면 현재 작업공간에서 두 형식을 모두 탐색한다.

```bash
rg -l --glob '*.md' '^```tandem-comments$' <workspace-root>
node scripts/comments.js list --workspace <workspace-root> --status open
```

4. 한 형식만 발견되면 그 workflow만 읽는다. 두 형식이 모두 발견되면 각각의 workflow를 읽고 독립적으로 처리한다. 아무것도 없으면 열린 코멘트가 없다고 보고한다.
5. 사용자가 파일이나 저장소를 지정했으면 전체 작업공간보다 그 범위를 우선한다.

스킬과 문서에는 사용자명·홈 디렉터리·머신별 작업공간을 포함한 절대경로를 기록하지 않는다. 명령 예시는 스킬 디렉터리에서 실행하는 형태이며 다른 위치에서는 런타임에 확인한 스킬 경로를 사용한다.

## 공통 처리

열린 코멘트는 마지막 작성자를 기준으로 나눈다.

- 마지막 글이 사용자의 글이면 `답변 필요`
- 마지막 글이 Codex의 글이면 `사용자 해결 대기`

`답변 필요` 코멘트는 앵커 주변의 현재 문서나 코드를 확인하고, 사용자의 이번 요청이 허용한 범위에서 수정 또는 설명한 뒤 한국어 답글을 남긴다. 같은 내용의 Codex 답글이 이미 마지막에 있으면 중복으로 추가하지 않는다.

Codex는 코멘트를 해결하거나 삭제하지 않는다. 답글을 남긴 뒤에도 열린 상태를 유지하며, 해결은 사용자가 해당 편집기에서 직접 수행한다. 편집기가 해결된 Tandem 스레드를 문서에서 삭제할 수 있으므로, Obsidian workflow는 읽거나 답하기 전에 append-only 이력을 먼저 보관한다. 별도의 읽기용 Markdown 내보내기는 사용자가 명시적으로 요청할 때만 만든다.

## 해결 대기 알림

스킬을 실행할 때마다 `사용자 해결 대기` 항목도 다시 집계해 완료 보고에 포함한다. 이전 실행에서 이미 답한 코멘트에는 새 답글을 반복하지 않고 다음 정보만 알린다.

- 형식과 저장소 또는 문서
- 스레드나 코멘트 ID
- 앵커의 짧은 요약
- 마지막 Codex 답글 시각

작업공간을 다시 검사하지 않은 상태에서 해결 여부를 추정하지 않는다. 스킬 실행 없이도 정기적으로 알림이 필요하면 사용자가 주기를 정한 뒤 별도의 Codex 자동화를 만든다.

## 다중 저장소

VS Code Comments는 작업공간 아래 Git 저장소를 런타임에 발견하고 저장소별 `.comments/`를 따로 읽는다. 상위 작업공간에 중앙 `.comments/`를 만들지 않는다. 같은 이름의 저장소나 동일 스레드 ID가 둘 이상이면 쓰기 전에 정확한 저장소를 확인한다.

Obsidian Tandem Comments는 Git 저장소 여부와 관계없이 지정된 작업공간 아래 Markdown을 탐색한다. 따라서 작업공간 루트에서 여러 프로젝트에 코멘트를 남겨도 한 번의 일반 조회로 두 형식을 함께 찾을 수 있다.

## 완료 보고

다음 항목만 간결하게 보고한다.

- 탐색한 범위와 발견한 형식
- 답변한 코멘트와 반영한 변경
- 사용자 해결 대기 코멘트
- 검증 결과
