# Obsidian Tandem Comments workflow

## 저장 형식

코멘트는 Markdown 본문 끝의 `tandem-comments` JSON 코드 블록에 저장된다. 본문 안에 별도 마커를
삽입하지 않는다. 블록 뒤에 Obsidian 각주 정의 같은 내용이 있으면 그대로 보존한다.
다음 예시의 시작과 끝 표시어는 실제 파일에서는 각각 `tandem-comments` 여는 코드 펜스와 닫는
코드 펜스로 쓴다.

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

1. 코드 블록과 그 뒤의 내용을 분리하고 JSON을 읽는다.
2. `status: open`인 항목의 마지막 댓글을 확인한다.
3. `anchor.exact`를 본문에서 찾고, 여러 번 나오면 `prefix`, `suffix`, `pos` 순서로 판별한다.
4. 질문이면 답을 작성하고, 수정 요청이면 요청 범위 안에서 본문을 고친다.
5. 확인한 코멘트의 `thread` 끝에 다음 형식의 한국어 답글을 추가한다.

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

## 앵커 관리

- `exact`는 본문의 정확한 인용문이다.
- `prefix`와 `suffix`는 앞뒤 약 20자의 문맥이다.
- `pos`는 코멘트 블록을 제외한 본문에서 `exact`가 시작하는 문자 오프셋이다.
- 본문을 고치기 전에 다른 열린 코멘트도 모두 찾아 기존 범위를 기억한다.
- 본문 변경 뒤 유일하게 대응되는 열린 코멘트의 `exact`, `prefix`, `suffix`, `pos`를 다시 만든다.
- 대상 문장이 삭제되면 같은 주제를 가리키는 가장 가까운 제목이나 문장으로만 옮긴다. 새 위치가
  명확하지 않으면 기존 앵커를 유지하고 사용자에게 알린다.

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
