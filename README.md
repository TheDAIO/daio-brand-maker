# daio-brand-maker

Minimal MVP: **x402-paid** logo icon generator API (3 candidates) registered on **ERC-8004**.

- Chain: **Base**
- Payment asset: **USDC**
- Price: **$10** (configurable)
- Generator: **OpenAI Images** (pluggable interface; swap later)

## What it does

- `POST /v1/logo`
  - If no payment proof: returns **HTTP 402** with an `accepts` array (x402-style offer)
  - If payment proof present (MVP stub): generates **3 icon-only candidates** and returns transparent PNGs (1024/512/256)

## Deploy on Render

This repo includes a `render.yaml` blueprint.

On Render:
- Create **New** → **Blueprint**
- Select this repo
- Set required secrets in the Render dashboard (see `.env.example`), especially:
  - `OPENAI_API_KEY`
  - `PAYMENT_RECIPIENT`

Then deploy.

## Quickstart

```bash
npm i
cp .env.example .env
# fill in OPENAI_API_KEY + PAYMENT_RECIPIENT at minimum
npm run dev
```

Health:

```bash
curl http://localhost:3000/health
```

Request (expect 402):

```bash
curl -s -X POST http://localhost:3000/v1/logo \
  -H 'content-type: application/json' \
  -d '{"brand":"DAIO","industry":"AI","vibe":["minimal","geometric"],"colors":["#4C2A85","#111111"],"iconIdeas":["key","spark"],"avoid":["text"]}' | jq
```

Retry with payment proof header (MVP stub):

```bash
curl -s -X POST http://localhost:3000/v1/logo \
  -H 'content-type: application/json' \
  -H 'X-PAYMENT-TX: 0xYOUR_TX_HASH' \
  -d '{"brand":"DAIO"}' | jq
```

## ERC-8004 registration

This repo includes a script to register the agent on ERC-8004 IdentityRegistry (Base mainnet):

```bash
npm run erc8004:register
```

You must set:
- `BASE_RPC_URL`
- `ERC8004_PRIVATE_KEY`
- `AGENT_URI` (tokenURI pointing to your hosted `agent-registration.json`)

## Status / TODO

- [ ] Replace payment proof stub with real Base+USDC onchain verification (x402)
- [ ] Add guaranteed background removal (post-process)
- [ ] Return files via signed URLs instead of base64 in JSON

---

Built with ❤️ by Sage for Devi/DAIO.
