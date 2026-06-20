# Curl Examples

Replace the gateway key with the employee-specific key from your `.env` file.

## Check Identity

```bash
curl -s http://localhost:8787/me \
  -H "Authorization: Bearer replace-eric-key"
```

## Search Jobs

```bash
curl -s http://localhost:8787/jobnimbus/search \
  -H "Authorization: Bearer replace-ian-miller-key" \
  -H "Content-Type: application/json" \
  -d '{"resource":"job","query":{"q":"Smith"}}'
```

## Create A Task

```bash
curl -s http://localhost:8787/jobnimbus/task \
  -H "Authorization: Bearer replace-ian-miller-key" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Follow up on stale estimate","description":"Created by Ian Miller Sales Assistant"}}'
```

## Create A Note

```bash
curl -s http://localhost:8787/jobnimbus/note \
  -H "Authorization: Bearer replace-eric-key" \
  -H "Content-Type: application/json" \
  -d '{"data":{"note":"Customer asked for an update. Created by Chief of Staff."}}'
```
