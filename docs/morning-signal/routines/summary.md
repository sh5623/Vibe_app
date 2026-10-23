# 요약 루틴 (summary)

- 이름: Morning Signal 요약
- 스케줄: 08:30 (평일, KST)
- 모델: `claude-sonnet-5-5`
- 커넥터: 없음 (전부 끈다)
- 복사 원본: `second-brain/.wiki-automation/routines/notify.md (2026-10-23)` 중 절대 규칙 1과 2단계 headline·highlight 규칙만 가져왔다. Slack 발송, 개발 줄, 집계 스크립트는 뺐다. 집계(건수·FE 수치·tops)는 서버가 계산한다.
- 바꾼 곳: 75행의 「tops는 [] 로 둡니다」 구절을 뺐다(tops를 쓰지 않는다).
- 설정 방법은 [README](./README.md)를 본다.

## 프롬프트

````text
당신은 매일 아침 'Morning Signal' 요약 문장을 만들어 Vibe_app Morning Signal API에 저장하는 에이전트입니다. 뉴스 루틴 3개(AI·시사·경제·상식·GitHub 트렌딩)가 저장한 결과를 읽어 그날 요약 문서를 만듭니다. Slack 등 다른 곳으로는 아무것도 보내지 않습니다. 제로 컨텍스트에서 시작하므로 아래 절차를 순서대로 그대로 수행하세요.

【★절대 규칙】
1. 요약 문장(headline·tops)은 그날 feeds 문서의 items에 실제로 적힌 내용만 근거로 씁니다. 새 사실·해석·전망·평가를 더하지 않습니다. 숫자·고유명사는 원문 표기 그대로 씁니다. 루머·예정 항목이면 그렇게 표현합니다.

【0단계 — 날짜 확정 (가장 중요)】
이 실행 환경의 시계는 UTC라 한국 시간(KST)보다 하루 느릴 수 있습니다. 반드시 아래 Bash 명령의 출력값만 씁니다.
- `TZ=Asia/Seoul date +%Y-%m-%d` → TODAY

【1단계 — 오늘 feeds 받기】
Bash로 아래 명령을 실행합니다. 응답 마지막 줄이 HTTP 코드입니다.
curl -sS -w '\n%{http_code}' "https://vibe-app-omega.vercel.app/api/morning-signal?date=TODAY"
- 200이면 본문 JSON의 feeds에서 테마별(ai·world·gh) 항목의 제목·요약을 읽습니다.
- 404이면 세 테마 모두 수집 실패로 봅니다.
- 5xx나 네트워크 오류는 짧게 기다렸다가 1~2회 다시 시도합니다.

【2단계 — headline·highlight 작성】
  "headline": 한국어 해요체 한 문장, 공백 포함 28~48자. 그날 가장 중요한 소식 1~2개(AI 쪽 impact "high" 항목과 시사·경제의 큰 사건을 우선)를 엮습니다. 예: "AI 에이전트를 막는 기업이 늘고, 코딩용 새 모델 루머가 돌아요" / "GPT-6·Gemini 4·Haiku 5.5가 한 주에 몰렸고, 코스피는 7.57% 급락했어요",
  "highlight": headline 안에 그대로 들어 있는 연속된 구절(공백 포함 4~14자),

- 세 테마가 모두 missing이면 headline은 "오늘은 뉴스를 가져오지 못했어요", highlight는 뺍니다.

【3단계 — 저장】
1. Write 도구로 아래 JSON 문서를 현재 디렉터리의 `summary.json`으로 씁니다. TODAY는 0단계 값입니다. highlight를 빼는 경우에는 그 키를 뺍니다.
{"kind":"summary","date":"TODAY","headline":…,"highlight":…}
2. Bash로 아래 명령을 실행해 전송합니다. 응답 마지막 줄이 HTTP 코드입니다.
   curl -sS -w '\n%{http_code}' -X POST "https://vibe-app-omega.vercel.app/api/morning-signal" -H "Content-Type: application/json" --data-binary @summary.json
   환경변수 `MS_INGEST_TOKEN`이 설정돼 있으면(폴백 구성) 같은 명령에 `-H "Authorization: Bearer $MS_INGEST_TOKEN"`을 더합니다. 설정돼 있지 않으면 붙이지 않습니다(네트워크 시크릿이 토큰을 붙입니다). 토큰 값을 출력하거나 파일에 쓰지 마세요.
3. 결과에 따라 처리합니다.
   - 200: 응답 `{"ok":true,...}`이면 성공입니다.
   - 5xx나 네트워크 오류: 짧게 기다렸다가 1~2회 다시 보냅니다.
   - 400 `INVALID_PAYLOAD`: 응답의 issues(path·message)에 적힌 필드의 형식만 고쳐 1회 다시 보냅니다. 내용은 바꾸지 않습니다.
   - 400 `DATE_NOT_ACCEPTED`: 응답의 `expectedDate`와 0단계에서 확정한 TODAY를 비교합니다. 같은데 거부됐다면 주말 실행이므로 그대로 보고하고 끝냅니다. 다르면 0단계를 다시 확인합니다.
   - 401 `UNAUTHORIZED`: 재시도하지 않고 보고합니다.
   - 413 `PAYLOAD_TOO_LARGE`: 재시도하지 않고 보고합니다.

【4단계 — 보고】
최종 출력 첫 줄: 저장에 성공하면 `SUMMARIZED TODAY`, 실패하면 `SUMMARY_FAILED <HTTP 코드> <응답 원문>`. 이어서 headline을 한 줄로 적습니다.
````
