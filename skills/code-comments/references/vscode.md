# VS Code Comments workflow

## 시작하기

1. `node scripts/comments.js repos --workspace <workspace-root>`로 저장소를 발견한다.
2. `node scripts/comments.js list --workspace <workspace-root> --status open`으로 열린 스레드를 모은다.
3. 조회 결과의 저장소, 상대 파일, 앵커와 전체 대화를 확인한다.
4. 앵커만 보지 말고 해당 파일의 주변 코드와 현재 Git 변경을 확인한다.
5. 스레드가 기록된 저장소에 대상 파일이 없으면 작업공간의 다른 저장소에서 같은 상대경로와 앵커를 찾는다. 한 저장소로만 확정되면 스레드를 그 저장소로 옮긴 뒤 처리하고, 둘 이상이면 사용자에게 대상을 확인한다.

저장 형식과 다중 저장소 경계는 [storage-and-scope.md](storage-and-scope.md)를 따른다.

## 저장소 경계

- `<repository>/.comments/`를 저장소별로 유지한다.
- 상위 작업공간에 별도의 `.comments/`를 만들거나 여러 저장소의 스레드를 합치지 않는다.
- 모든 조회 결과와 완료 보고에 저장소 이름을 포함한다.
- 답글과 새 스레드는 대상 저장소를 확정한 뒤 append-only 이벤트와 스레드 잠금 규칙으로 기록한다.
- 저장소 이름이 겹치거나 대상이 둘 이상이면 쓰기 전에 사용자에게 확인한다.

잘못된 저장소에 만들어진 스레드를 올바른 저장소로 옮긴다. 이 명령은 대상 파일과 앵커가 확인될 때만 실행된다.

```bash
node scripts/comments.js relocate --workspace <workspace-root> \
  --from-repo <source-repository> --to-repo <target-repository> --thread <thread-id>
```

## 답글과 새 스레드

기존 스레드에 답글을 남긴다.

```bash
node scripts/comments.js reply --workspace <workspace-root> --repo <repository> \
  --thread <thread-id> --body '<reply>'
```

답변 과정에서 앵커 문장을 수정했다면 현재 텍스트나 줄 범위로 스레드를 다시 연결한다.

```bash
node scripts/comments.js reanchor --workspace <workspace-root> --repo <repository> \
  --thread <thread-id> --start-line <line> --end-line <line>
```

새 스레드는 정확한 텍스트 앵커를 우선 사용한다.

```bash
node scripts/comments.js create --workspace <workspace-root> --repo <repository> \
  --file <repository-relative-file> --anchor-text '<exact-text>' --body '<comment>'
```

정확한 앵커가 어렵거나 텍스트가 반복될 때만 1-based 줄 범위를 사용한다.

```bash
node scripts/comments.js create --workspace <workspace-root> --repo <repository> \
  --file <repository-relative-file> --start-line <line> --end-line <line> --body '<comment>'
```

답글과 본문은 셸에서 실행되지 않도록 작은따옴표로 감싸고, 본문에 작은따옴표가 있으면 안전하게 이스케이프한다. 사용자 텍스트를 명령 치환이나 환경 변수로 평가하지 않는다.

## 범위 밖

이 workflow는 사람과 Codex 사이의 코멘트 교환만 다룬다. 원본 `comment-cycle`의 agent dispatch, claim, 자동 해결, merge queue, landing과 커밋 provenance 절차는 적용하지 않는다. 커밋이 필요하면 별도의 `commit-rule` 스킬을 사용한다.

## 검증

- `repos` 결과가 실제 Git 저장소와 일치하는지 확인한다.
- 답글 뒤 `get`으로 작성자, 본문과 `open` 상태를 다시 읽는다.
- 새 스레드 뒤 대상 저장소에 `.comments/threads/<thread-id>.jsonl`이 생겼는지 확인한다.
- 코드 변경이 있으면 해당 저장소의 테스트와 `git diff --check`, `git status --short`로 범위를 확인한다.
