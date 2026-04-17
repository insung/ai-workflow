# Agent Template for Kiro CLI

본 문서는 Kiro CLI 커스텀 에이전트 생성 시 따라야 할 구조, 핵심 개념, 설정 파일(JSON) 스키마를 명시한다. 작성 시 아래 스키마와 개념을 정확히 준수하라.

## 1. 핵심 개념 (Key Concepts)
- **Specialization (특화):** 특정 도메인(AWS, 코드 리뷰 등)에 맞춰 제한된 권한과 집중된 컨텍스트를 제공한다.
- **Context Injection:** `resources`(정적 파일/스킬) 및 `hooks`(동적 명령어 출력)를 활용해 에이전트에 프로젝트 상태를 주입한다.
- **Security & Scoping (보안 및 권한 제한):** 
  - `allowedTools`를 통해 매번 사용자 승인 없이 실행 가능한 도구를 사전 정의한다.
  - `toolsSettings`를 사용해 파일 읽기/쓰기 경로 제한(`allowedPaths`) 또는 실행 명령어 제한(`allowedCommands`)을 둔다.
- **MCP Integration:** Model Context Protocol(MCP)을 연동하여 로컬/원격 도구를 에이전트에 쉽게 붙일 수 있다.

## 2. 디렉토리 위치 (Directory Location)
Kiro CLI에서 커스텀 에이전트는 설정 파일(`.json`)과 프롬프트 파일(`.md`) 쌍으로 구성된다. 아래 경로 중 하나에 위치시켜라:

- **프로젝트 전용 (Project Local)**: `.kiro/agents/{agent-name}.json` 및 `.kiro/agents/{agent-name}.md`
- **전역 (Global)**: `~/.kiro/agents/{agent-name}.json` 및 `~/.kiro/agents/{agent-name}.md`

## 3. 설정 파일 구조 (JSON Schema)

| 필드명 | 설명 |
| :--- | :--- |
| `name` | 에이전트의 고유 식별자 |
| `description` | 에이전트의 목적 (위임 및 설명용) |
| `prompt` | 시스템 프롬프트 직접 문자열 입력 또는 **동일 디렉토리 내의 마크다운 파일명** 지정 (`{agent-name}.md`). 단, 상대 경로는 지원하지 않음. |
| `tools` | 사용할 수 있는 도구 목록 (`read`, `write`, `shell`, `@mcp-name` 등) |
| `allowedTools` | 사용자 승인(Prompt) 없이 자동으로 실행 가능한 안전한 도구 목록 |
| `toolAliases` | 긴 MCP 도구 이름을 짧게 매핑 (`@git/git_status` → `status`) |
| `toolsSettings` | `allowedPaths`(읽기/쓰기 허용 경로), `allowedCommands`(허용 쉘 명령어) 등 세부 제어 |
| `resources` | 컨텍스트로 제공할 리소스 경로 배열. 정적 파일은 `file://`, 스킬은 `skill://` 프로토콜을 사용하라. |
| `hooks` | 이벤트 기반 실행 명령어 (`agentSpawn`: 시작 시점, `userPromptSubmit`: 사용자가 메시지를 보낼 때마다) |
| `mcpServers` | 로컬 또는 원격 MCP 서버 연동 설정 (`command`, `url`, `oauth` 포함) |
| `model` | 사용할 LLM 모델 지정 (`claude-sonnet-4` 등) |

## 4. 예제 (Examples)

### Example A: Code Review Agent
코드 품질 검사를 위해 제한된 쉘 명령어와 읽기 권한만 갖는 에이전트이다. 동일 디렉토리에 `code-reviewer.md` 프롬프트 파일이 존재해야 한다.

```json
{
  "name": "code-reviewer",
  "description": "Reviews code changes against best practices.",
  "prompt": "code-reviewer.md",
  "tools": ["read", "shell"],
  "resources": [
    "skill://.kiro/skills/**/SKILL.md"
  ],
  "toolsSettings": {
    "read": {
      "allowedPaths": ["src/**", "tests/**"]
    },
    "shell": {
      "allowedCommands": ["grep", "eslint", "pylint"]
    }
  },
  "hooks": {
    "agentSpawn": ["git diff"]
  }
}
```

### Example B: Dev Workflow Agent (with MCP & Hooks)
Git 상태를 파악하고, 짧은 알리아스로 MCP 도구를 사용하는 개발용 에이전트이다.

```json
{
  "name": "dev-workflow",
  "description": "General development agent with Git context.",
  "prompt": "You are an assistant helping with daily development tasks.",
  "tools": ["read", "write", "shell", "@git/git_status"],
  "allowedTools": ["@git/git_status", "read"],
  "resources": [
    "skill://.kiro/skills/**/SKILL.md"
  ],
  "toolAliases": {
    "status": "@git/git_status"
  },
  "hooks": {
    "userPromptSubmit": ["git status -s"]
  }
}
```

## 5. Kiro 에이전트 작성 팁
1. **제한적 스코핑 시작:** 처음에는 필요한 도구 권한(toolsSettings)을 최소로 부여하여 시작하라.
2. **동적 컨텍스트 활용:** `hooks`를 사용하여 사용자가 말할 때마다 현재 git 브랜치나 상태를 에이전트에게 자동 주입하라.
3. **편의성과 안전성의 균형:** 자주 쓰는 단순 조회 명령어는 `allowedTools`에 등록하여 승인 팝업의 피로도를 줄여라.

## 6. 제약 사항 (Constraints)
- [DANGER] 프롬프트 파일(`.md`) 지정 시 상대 경로를 사용하지 마라. 반드시 JSON 파일과 동일한 디렉토리에 위치시켜라.
- [DANGER] 시스템 파괴 위험이 있는 명령어(예: `rm`, `chmod`)를 `allowedCommands`에 등록하지 마라.
