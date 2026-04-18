# AI 에이전트 플랫폼별 특이 명세 (Platform Specifics)

본 문서는 오픈 표준 에이전트 규격 외에 각 플랫폼(CLI)이 요구하는 고유한 설정 파일 및 특이 사항을 정의한다.

## 1. 플랫폼별 설정 및 경로 (Configuration & Paths)

| 항목 | Gemini CLI | Claude Code | Kiro CLI |
|---|---|---|---|
| **에이전트 경로** | `.gemini/agents/*.md` | `.claude/agents/*.md` | `.kiro/agents/*.md` |
| **스킬 경로** | `.gemini/skills/` | `.claude/skills/` | `.kiro/skills/` |
| **플랫폼 설정** | `.gemini/policies/*.toml` | `.claude/config.json` | `.kiro/agents/agent.json` |
| **핵심 모델** | `gemini-*` | `claude-3-5-sonnet` | `gpt-4o`, `claude-*` |

## 2. 서브에이전트 운용 방식 (Subagent Dispatch)

| 구분 | Gemini CLI | Claude Code | Kiro CLI |
|---|---|---|---|
| **디스패치 도구** | 전용 서브에이전트 툴 (예: `generalist`) | `Task` tool | Registry API 호출 |
| **상태 공유** | 부모의 컨텍스트 일부를 스냅샷으로 공유 | 독립 세션 실행 후 결과만 요약 반환 | JSON 기반의 구조화된 상태 전달 |
| **격리 수준** | 프로세스 단위 격리 | Git Worktree 기반 물리적 격리 지원 | API 엔드포인트 기반 완전 격리 |

## 3. 플랫폼별 고유 기능 (Vendor-Specific Features)

### 💎 Gemini CLI (Governance & Persistence)
- **Policy Enforcement**: `.gemini/policies/*.toml`을 통해 도구 사용 권한을 세밀하게 제어 (예: `run_shell_command` 금지 등).
- **Global Memory**: `save_memory` 툴을 통해 세션이 종료되어도 유지되는 프로젝트/전역 지식을 저장.
- **Plan Mode**: `enter_plan_mode`를 통해 코드를 수정하기 전 안전한 리서치 및 설계 단계를 강제.
- **Universal Rules**: `GEMINI.md`를 프로젝트 최상위에 두어 모든 에이전트에게 공통 룰을 주입.

### 🤖 Claude Code (Safety & Extension)
- **Hooks**: `PreToolUse`, `PostToolUse` 훅을 통해 도구 실행 전후에 커스텀 로직(검사, 로깅 등) 삽입 가능.
- **Permission Mode**: `bypassPermissions`, `acceptEdits` 등을 통해 사용자 승인 절차를 자동화하거나 제약.
- **MCP Servers**: 플랫폼 내부 도구 외에 외부 MCP(Model Context Protocol) 서버를 연결하여 기능을 무한히 확장.
- **Rich UI**: `color` 설정을 통해 CLI 출력 시 에이전트별 고유 색상 부여.

### ⚡ Kiro CLI (Registry & Workflow)
- **Agent Registry**: `agent.json`을 통해 에이전트의 버전, 소유자, 엔드포인트를 관리하며 상호 호출 트리거 정의.
- **Structured I/O**: 모든 입출력을 JSON Schema로 정의하여 에이전트 간 데이터 전달의 정확성 보장.
- **Long-running Tasks**: 상태 머신(State Machine) 기반으로 긴 호흡의 워크플로우를 중단 없이 관리.

## 4. 공통 준수 사항 (Common Standards)
- 모든 플랫폼은 **YAML Frontmatter + Markdown** 기반의 프롬프트 정의를 지원한다.
- 플랫폼에 관계없이 `{CLI_DIR}` 변수를 사용하여 프로젝트 루트의 설정 디렉토리를 참조하라.
