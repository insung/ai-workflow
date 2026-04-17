---
description: 제미나이 딥리서치 성능을 가진 리서치 워크플로우
---

아래 Step 은 사용자의 승인이 있지 않은 한 다음 단계로 넘어가선 안된다.

## Step 1. 전략 수립 (The Architect)
1. 사용자 요구사항을 분석하라.
2. 사용자가 "A에 대해 조사해줘"라고 입력했을 때, 이를 그대로 검색하는 대신 관점을 다양화하고 키워드 중심으로 전략을 수립하라.
4. 수립된 전략에 대해 사용자에게 검토를 맡아라.

## Step 2. 병렬 탐색 및 깊이 탐색 (The Gatherers)
1. 검토 완료된 내용을 키워드 중심으로 2~10개의 독립적인 Sub-task로 나누어라.
2. 각 task에 적합한 검색 쿼리와 탐색할 전문 사이트(예: Substack, Medium, GitHub 등)를 지정하라.
3. 각 task에 맞게 researcher.md 스킬(에이전트)을 호출하되, 단순 리서치 워크로드는 반드시 `gemini-3.1-flash` 모델 환경에서 동작하도록 라우팅하라.
4. Multi-agent execution 기능을 활용해 에이전트를 동시에 실행하라.

## Step 3. 수집된 정보 처리 및 인덱싱 (The Indexing)
1. 수집된 정보들은 workspace/research/{Topic} 디렉토리를 만들어 Sub-task 에 맞는 문서명으로 기록하라.
2. doc-indexer.md 에이전트를 사용하여 workspace/research/INDEX.md 를 만들어라.