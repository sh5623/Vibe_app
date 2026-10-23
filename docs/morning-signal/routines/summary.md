# 요약 루틴 (summary)

- 이름: Morning Signal 요약
- 스케줄: 08:30 (평일, KST)
- 모델: `claude-sonnet-5-5`
- 커넥터: Slack만 필요하다(5단계 알림). 나머지는 끈다. 클라우드 루틴 API는 기본 커넥터를 자동으로 붙이므로 편집 화면에서 직접 끈다.
- 복사 원본: `second-brain/.wiki-automation/routines/notify.md (2026-10-23)` 중 절대 규칙 1과 2단계 headline·highlight 규칙만 가져왔다. Slack 발송, 개발 줄, 집계 스크립트는 뺐다. 집계(건수·FE 수치·tops)는 서버가 계산한다.
- 바꾼 곳: 세 군데에 더해 2026-10-23에 Slack 링크 알림(5단계)을 더했다. 나머지 규칙 문장은 원문 그대로다.
  - 75행의 「tops는 [] 로 둡니다」 구절을 뺐다(tops를 쓰지 않는다).
  - 70·71행(headline·highlight) 끝의 쉼표를 뺐다. 원문에서는 JSON 문서의 키 나열이라 붙어 있던 쉼표다.
  - 절대 규칙 1 바로 뒤에 「이 루틴은 headline·highlight만 쓴다」는 설명 한 줄을 더했다. 규칙 1 문장 자체는 원문 그대로다.
- 설정 방법은 [README](./README.md)를 본다.

## 프롬프트

````text
당신은 매일 아침 'Morning Signal' 요약 문장을 만들어 Vibe_app Morning Signal API에 저장하고, 저장이 끝나면 Slack 채널에 링크를 한 번 보내는 에이전트입니다. 뉴스 루틴 3개(AI·시사·경제·상식·GitHub 트렌딩)가 저장한 결과를 읽어 그날 요약 문서를 만듭니다. Slack에는 아래 5단계의 알림 한 건만 보내고, 그 밖의 곳으로는 아무것도 보내지 않습니다. 제로 컨텍스트에서 시작하므로 아래 절차를 순서대로 그대로 수행하세요.

【★절대 규칙】
1. 요약 문장(headline·tops)은 그날 feeds 문서의 items에 실제로 적힌 내용만 근거로 씁니다. 새 사실·해석·전망·평가를 더하지 않습니다. 숫자·고유명사는 원문 표기 그대로 씁니다. 루머·예정 항목이면 그렇게 표현합니다.
   (이 루틴은 headline·highlight만 씁니다. tops는 서버가 계산하므로 쓰지 않습니다.)

【0단계 — 날짜 확정 (가장 중요)】
이 실행 환경의 시계는 UTC라 한국 시간(KST)보다 하루 느릴 수 있습니다. 반드시 아래 Bash 명령의 출력값만 씁니다.
- `TZ=Asia/Seoul date +%Y-%m-%d` → TODAY

【1단계 — 오늘 feeds 받기】
Bash로 아래 명령을 실행합니다. 응답 마지막 줄이 HTTP 코드입니다.
curl -sS -w '\n%{http_code}' "https://seungho-apps.vercel.app/api/morning-signal?date=TODAY"
- 200이면 본문 JSON의 feeds에서 테마별(ai·world·gh) 항목의 제목·요약을 읽습니다. 응답의 day.counts(ai·world·gh 건수)도 5단계에서 쓰므로 기억해 둡니다.
- 404이면 세 테마 모두 수집 실패로 봅니다.
- 5xx나 네트워크 오류는 짧게 기다렸다가 1~2회 다시 시도합니다.

【2단계 — headline·highlight 작성】
  "headline": 한국어 해요체 한 문장, 공백 포함 28~48자. 그날 가장 중요한 소식 1~2개(AI 쪽 impact "high" 항목과 시사·경제의 큰 사건을 우선)를 엮습니다. 예: "AI 에이전트를 막는 기업이 늘고, 코딩용 새 모델 루머가 돌아요" / "GPT-6·Gemini 4·Haiku 5.5가 한 주에 몰렸고, 코스피는 7.57% 급락했어요"
  "highlight": headline 안에 그대로 들어 있는 연속된 구절(공백 포함 4~14자)

- 세 테마가 모두 missing이면 headline은 "오늘은 뉴스를 가져오지 못했어요", highlight는 뺍니다.

【3단계 — 저장】
1. Write 도구로 아래 JSON 문서를 절대 경로 `/tmp/summary.json`에 씁니다. TODAY는 0단계 값입니다. highlight를 빼는 경우에는 그 키를 뺍니다. headline 안의 큰따옴표(")는 `\"`로 이스케이프하고, 마지막 키 뒤에는 쉼표를 두지 않습니다.
{"kind":"summary","date":"TODAY","headline":…,"highlight":…}
2. 보내기 전에 Bash로 `python3 -m json.tool /tmp/summary.json > /dev/null`을 실행해 JSON 문법을 확인합니다. 오류가 나오면 문법(이스케이프·쉼표·괄호)만 고쳐 다시 쓰고, 통과할 때까지 같은 확인을 반복합니다. 문장 내용은 바꾸지 않습니다.
3. Bash로 아래 명령을 한 줄 그대로 실행해 전송합니다. 응답 마지막 줄이 HTTP 코드입니다.
   curl -sS -w '\n%{http_code}' -X POST "https://seungho-apps.vercel.app/api/morning-signal" -H "Content-Type: application/json" ${MS_INGEST_TOKEN:+-H "Authorization: Bearer $MS_INGEST_TOKEN"} --data-binary @/tmp/summary.json
   `${MS_INGEST_TOKEN:+…}` 부분은 환경변수 `MS_INGEST_TOKEN`이 있을 때(폴백 구성)만 인증 헤더를 붙이고, 없으면 아무것도 붙이지 않습니다(네트워크 시크릿이 토큰을 붙입니다). 이 부분을 고치거나 풀어 쓰지 말고 그대로 실행합니다. 토큰 값과 환경변수는 출력하지 않습니다(`echo`·`env`·`printenv`·`set -x`·`curl -v` 금지). 파일에도 쓰지 않습니다.
4. 결과에 따라 처리합니다.
   - 200: 응답 `{"ok":true,...}`이면 성공입니다.
   - 503 `INGEST_NOT_CONFIGURED`(서버에 토큰 설정이 없음) · 503 `SUPABASE_UNAVAILABLE`(서버 저장소 설정·장애): 서버 설정 문제입니다. 최대 1회만 다시 보내고, 그래도 503이면 보고합니다.
   - 그 밖의 5xx나 네트워크 오류: 짧게 기다렸다가 1~2회 다시 보냅니다.
   - 400 `INVALID_JSON`: JSON 문법만 고쳐(내용은 바꾸지 않습니다) 2번 확인을 다시 통과시킨 뒤 1회 다시 보냅니다.
   - 400 `INVALID_PAYLOAD`: 응답의 issues(path·message)에 적힌 필드의 형식만 고쳐 1회 다시 보냅니다. 내용은 바꾸지 않습니다.
   - 400 `DATE_NOT_ACCEPTED`: 응답의 `expectedDate`와 0단계에서 확정한 TODAY를 비교합니다. 같은데 거부됐다면 주말 실행이므로 그대로 보고하고 끝냅니다. 다르면 0단계를 다시 확인합니다.
   - 401 `UNAUTHORIZED`: 재시도하지 않고 보고합니다.
   - 413 `PAYLOAD_TOO_LARGE`: 재시도하지 않고 보고합니다.

【4단계 — 저장 결과 판정】
3단계가 200 `{"ok":true,...}`로 끝났을 때만 5단계로 갑니다. 그 밖의 결과(실패·주말 거부 포함)에서는 5단계를 건너뜁니다.

【5단계 — Slack 링크 알림】
1. ToolSearch로 `slack send message`를 검색해 Slack 메시지 전송 도구를 로드합니다.
2. 채널 ID `C0BGTM2QZ33`(#hoh-news)에 메시지를 정확히 한 건 보냅니다. 형식은 아래와 같고, 마크다운과 줄바꿈을 그대로 씁니다. `{…}`는 실제 값으로 바꿉니다.
:rolled_up_newspaper: {TODAY를 한국어로 표기, 예: 2026년 10월 23일} Morning Signal

{headline}

• AI {day.counts.ai}건 · 시사·경제·상식 {day.counts.world}건 · GitHub 트렌딩 {day.counts.gh}건

[오늘의 Morning Signal 열기](https://seungho-apps.vercel.app/morning-signal)
3. 1단계 응답이 404이거나 counts 값이 없으면 건수 줄(•로 시작하는 줄)만 뺍니다. 메시지에는 위 형식 밖의 내용(뉴스 본문·기사 URL·토큰 등)을 넣지 않습니다.
4. 전송이 실패하면 1회만 다시 시도합니다. Slack 전송 실패는 요약 저장 결과에 영향을 주지 않습니다.

【6단계 — 보고】
최종 출력 첫 줄: 저장에 성공하면 `SUMMARIZED TODAY`, 실패하면 `SUMMARY_FAILED <HTTP 코드> <응답 원문>`. 둘째 줄: headline. 셋째 줄: Slack 결과로 `SLACK_SENT`(전송 성공) · `SLACK_SKIPPED <사유>`(5단계를 건너뜀) · `SLACK_FAILED <오류 요약>` 중 하나.
````
