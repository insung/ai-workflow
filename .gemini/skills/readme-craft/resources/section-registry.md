# 유형별 섹션 레지스트리 (Section Registry)

유형별로 필수(R) / 권장(O) 섹션을 정의한다. 필수 섹션은 반드시 포함하라. 권장 섹션은 프로젝트에서 해당 정보를 감지한 경우에만 포함하라.

## 공통 섹션 (모든 유형)

| # | 섹션 | 필수 | 비고 |
|---|------|------|------|
| 1 | Title + One-liner | R | 프로젝트명 + 10단어 이내 설명 |
| 2 | Description | R | 해결하는 문제와 가치 제안 |
| 3 | Quick Start | R | 5개 이하 명령어 |
| 4 | Installation | R | 복수 옵션 권장 |
| 5 | Usage | R | 기본 코드 예시 |
| 6 | License | R | |
| 7 | Table of Contents | O | 섹션 8개 이상일 때 |
| 8 | Contributing | O | 오픈소스인 경우 R |
| 9 | Troubleshooting | O | |

## 유형별 추가 섹션

### CLI Tool
| 섹션 | 필수 | 비고 |
|------|------|------|
| Commands | R | 명령어 목록 + 설명 |
| Options/Flags Table | R | 플래그, 설명, 기본값 테이블 |
| Demo GIF | R | 동작 시연 |

### Component Library
| 섹션 | 필수 | 비고 |
|------|------|------|
| Components Table | R | 컴포넌트명, 설명, 상태(Stable/Beta) |
| Theming | R | ThemeProvider 사용법 |
| Bundle Size | R | 전체 + 개별 컴포넌트 |
| Storybook Link | R | 라이브 데모 링크 |

### Backend API/Service
| 섹션 | 필수 | 비고 |
|------|------|------|
| API Endpoints | R | 메서드, 경로, 설명 테이블 |
| Authentication | R | 인증 방식 설명 |
| Environment Variables | R | 변수명, 설명, 필수 여부 테이블 |
| Project Structure | R | 디렉토리 트리 + 역할 설명 |
| Performance | O | 벤치마크 테이블 |

### Web Application
| 섹션 | 필수 | 비고 |
|------|------|------|
| Features | R | 주요 기능 목록 |
| Screenshots | R | UI 스크린샷 |
| Tech Stack | R | 프론트/백/DB 기술 목록 |
| Environment Variables | R | |
| Project Structure | R | |
| Deployment | O | 배포 가이드 |

### Framework/Boilerplate
| 섹션 | 필수 | 비고 |
|------|------|------|
| Project Structure | R | 생성되는 디렉토리 구조 |
| Scaffolding Commands | R | init/generate 명령어 |
| Conventions | R | 코딩 컨벤션/규칙 |
| Configuration | R | 옵션 테이블 |

### Data Science/ML
| 섹션 | 필수 | 비고 |
|------|------|------|
| Dataset | R | 소스, 크기, 분할 비율 |
| Model Performance | R | 메트릭 테이블 (Accuracy, F1 등) |
| Reproduce | R | 재현 명령어 |
| Notebooks | O | 노트북 파일 링크 |

### AI Agent/Workflow
| 섹션 | 필수 | 비고 |
|------|------|------|
| Agents Table | R | 에이전트명, 역할, 스킬 |
| Pipeline | R | 실행 흐름 다이어그램 |
| Directory Structure | R | |

### Internal/Team Project
| 섹션 | 필수 | 비고 |
|------|------|------|
| Architecture | R | 시스템 다이어그램 |
| Getting Started (Onboarding) | R | 신규 멤버 온보딩 절차 |
| Branch Strategy | R | |
| Development Workflow | R | |
| Environment Variables | R | |
