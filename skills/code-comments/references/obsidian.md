# Obsidian Tandem Comments workflow

## 저장 형식

활성 코멘트는 Markdown 본문 끝의 `tandem-comments` JSON 코드 블록에 저장된다. Tandem Comments에서 해결하면 해당 스레드가 문서에서 삭제될 수 있으므로 이 블록만 장기 이력으로 간주하지 않는다. Codex는 읽거나 답하기 전에 저장소별 `.comments/tandem/threads/<id>.jsonl`에 전체 스레드 snapshot을 append-only로 보관한다. Obsidian UI는 원문 문서의 코드 블록만 읽으며 숨김 이력은 복구와 Git 보존에 사용한다.

```bash
node scripts/tandem-history.js archive --root <vault-or-repository>
```

이 기록은 대화 보존용이며 플러그인의 코멘트 목록에는 자동으로 나타나지 않는다. Git에 함께 커밋할 수 있고 같은 내용은 digest로 중복 저장하지 않는다. 해결된 대화를 UI에서 다시 보려면 원래 문서의 코드 블록에 `status: resolved`로 복원하고 플러그인의 `Show resolved`를 사용한다. 별도의 읽기용 Markdown은 사용자가 명시적으로 요청할 때만 `export-markdown --output <output-markdown>`으로 만든다. 본문 안에 별도 마커를 삽입하지 않으며, 코멘트 블록 뒤에 Obsidian 각주 정의 같은 내용이 있으면 그대로 보존한다. 다음 예시의 시작과 끝 표시어는 실제 파일에서는 각각 `tandem-comments` 여는 코드 펜스와 닫는 코드 펜스로 쓴다.

````markdown
<tandem-comments 코드 블록 시작>
// Schema: { "<id>": { anchor:{exact,prefix,suffix,pos?}, status:open|resolved, thread:[{author,ts,text}], suggestion?:{replacement,author,ts,result?} } }
// Anchor = quote from the prose. To locate: search for "exact", disambiguate via prefix/suffix.
{
  "a1f3": {
    "anchor": {
      "exact": "검토할 문장",
      "prefix": "앞 문맥 ",
      "suffix": " 뒤 문맥",
      "pos": 42
    },
    "status": "open",
    "thread": [
      {
        "author": "insung",
        "ts": "2026-08-29T01:00:00Z",
        "text": "이 부분을 다시 검토해줘."
      }
    ]
  }
}
<tandem-comments 코드 블록 끝>
````

## 읽기와 답글

1. 현재 코멘트를 history script로 보관한다.
2. 코드 블록과 그 뒤의 내용을 분리하고 JSON을 읽는다.
3. `status: open`인 항목의 마지막 댓글을 확인한다.
4. `anchor.exact`를 본문에서 찾고, 여러 번 나오면 `prefix`, `suffix`, `pos` 순서로 판별한다.
5. 질문이면 답을 작성하고, 수정 요청이면 요청 범위 안에서 본문을 고친다.
6. 확인한 코멘트의 `thread` 끝에 다음 형식의 한국어 답글을 추가한다.
7. 답글과 갱신한 앵커까지 다시 보관한다.
8. 사용자가 별도의 읽기용 Markdown을 요청한 경우에만 `export-markdown`로 지정한 파일을 갱신한다.

```json
{
  "author": "Codex",
  "ts": "<ISO-8601 UTC>",
  "text": "확인하거나 반영한 내용"
}
```

- 질문에는 결론과 이유를 답한다.
- 수정 요청을 반영했다면 무엇을 바꿨는지 적는다.
- 반영하지 못했다면 이유와 필요한 확인을 적는다.
- 댓글 문자열의 줄바꿈은 `\n`으로 이스케이프한다.
- 기존 사용자 댓글의 author, timestamp와 text를 바꾸지 않는다.

## 삭제된 대화 복구

해결로 문서에서 사라진 대화는 먼저 Git의 마지막 보존 상태에서 복구한다.

```bash
node scripts/tandem-history.js archive-git --root <vault-or-repository> --ref HEAD
node scripts/tandem-history.js archive --root <vault-or-repository>
node scripts/tandem-history.js mark-resolved --root <vault-or-repository> --threads <id,id,...>
node scripts/tandem-history.js list --root <vault-or-repository>
```

- `archive-git`은 지정한 Git 참조의 Markdown에서 Tandem 스레드를 읽어 이력 저장소로 복구한다.
- 이어서 `archive`를 실행하면 아직 문서에 남은 최신 스레드를 추가한다.
- 사용자가 해결했다고 확인했고 현행 문서에서 사라진 ID는 `mark-resolved`로 관측 상태를 기록한다. 정확한 해결 시각을 추정하지 않고 확인한 시각만 남긴다.
- Git에 한 번도 기록되지 않은 대화는 Codex 작업 기록 등 정확한 원문이 확인될 때만 복구한다. 작성자, 시각과 본문을 추정해 만들지 않는다.
- UI 복원이 요청되면 보관된 파일 경로와 앵커를 검증하고 원래 문서의 코드 블록에 병합한다. 과거 해결 스레드는 `resolved` 상태로 복원하며 `open`으로 되살리지 않는다.

## 앵커 관리

- `exact`는 본문의 정확한 인용문이다.
- `prefix`와 `suffix`는 앞뒤 약 20자의 문맥이다.
- `pos`는 코멘트 블록을 제외한 본문에서 `exact`가 시작하는 문자 오프셋이다.
- 본문을 고치기 전에 다른 열린 코멘트도 모두 찾아 기존 범위를 기억한다.
- 본문 변경 뒤 유일하게 대응되는 열린 코멘트의 `exact`, `prefix`, `suffix`, `pos`를 다시 만든다.
- 대상 문장이 삭제되면 같은 주제를 가리키는 가장 가까운 제목이나 문장으로만 옮긴다. 새 위치가 명확하지 않으면 기존 앵커를 유지하고 사용자에게 알린다.

## 새 코멘트와 수정 제안

- 새 코멘트는 사용자가 요청했을 때만 만든다.
- ID는 기존 ID와 겹치지 않는 4자리 16진수로 만든다.
- 수정 제안은 일반 열린 코멘트에 다음 객체를 추가한다.

```json
{
  "suggestion": {
    "replacement": "제안 문장",
    "author": "Codex",
    "ts": "<ISO-8601 UTC>"
  }
}
```

- 제안 이유는 `thread`에 적고, 제안만 요청받았을 때는 본문을 고치지 않는다.
- 제안의 수락·거절과 해결 상태 변경은 사용자가 Obsidian에서 직접 수행한다.
- 블록이 없고 새 코멘트를 요청받았으면 본문과 블록 사이에 빈 줄 하나를 두고 파일 끝에 추가한다.
- 닫는 코드 블록 뒤의 각주 정의나 다른 내용은 그대로 유지한다.
