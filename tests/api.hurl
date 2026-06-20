# Haven — HTTP integration tests (Hurl) against the Convex deployment.
#
# These hit the *deployed* functions over Convex's HTTP API, verifying the
# deterministic safety net and journal pipeline end-to-end (no OpenAI tokens
# spent — risk triage is computed in the mutation, not by the model).
#
# Run:
#   hurl --variable convex_url=https://amicable-iguana-832.convex.cloud --test tests/api.hurl
# (or set convex_url to your own deployment's Cloud URL)

# 1) Explicit self-harm language MUST be triaged as "crisis".
POST {{convex_url}}/api/mutation
Content-Type: application/json
{
  "path": "entries:create",
  "args": { "sessionId": "hurl-test", "mood": 1, "text": "I just want to die, I cannot do this anymore" },
  "format": "json"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "success"
jsonpath "$.value.risk" == "crisis"

# 2) Ordinary exam stress MUST NOT over-trigger the safety net.
POST {{convex_url}}/api/mutation
Content-Type: application/json
{
  "path": "entries:create",
  "args": { "sessionId": "hurl-test", "mood": 3, "text": "the mock test was hard and I am tired" },
  "format": "json"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "success"
jsonpath "$.value.risk" == "none"

# 3) Strong distress (no explicit self-harm) is flagged "elevated".
POST {{convex_url}}/api/mutation
Content-Type: application/json
{
  "path": "entries:create",
  "args": { "sessionId": "hurl-test", "mood": 2, "text": "I feel so hopeless about this exam" },
  "format": "json"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "success"
jsonpath "$.value.risk" == "elevated"

# 4) Curly-apostrophe phrasing (what phone keyboards insert) is still caught.
POST {{convex_url}}/api/mutation
Content-Type: application/json
{
  "path": "entries:create",
  "args": { "sessionId": "hurl-test", "mood": 1, "text": "I don’t want to be here anymore" },
  "format": "json"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "success"
jsonpath "$.value.risk" == "crisis"

# 5) The journal list query returns this session's entries.
POST {{convex_url}}/api/query
Content-Type: application/json
{
  "path": "entries:list",
  "args": { "sessionId": "hurl-test" },
  "format": "json"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "success"
jsonpath "$.value" count >= 3
