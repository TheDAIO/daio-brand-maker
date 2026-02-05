import express from 'express';
import crypto from 'node:crypto';
import { LogoRequestSchema } from './schema.js';
import { config, requireOpenAI, requireRecipient } from './config.js';
import { logger } from './logger.js';
import { buildLogoSpec, buildPrompts, hashRequest } from './prompting.js';
import { OpenAIImageGenerator } from './generators/openaiImageGenerator.js';
import { exportSizes } from './postprocess/transparent.js';
import { buildAccepts, newPaymentId, paymentRequiredResponse, verifyPayment } from './payments/x402.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Tiny in-memory store for idempotency + replay protection (MVP). Replace with Redis/Postgres.
const jobs = new Map(); // requestHash -> result
const usedPaymentProofs = new Set();

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve registration file (for development)
app.get('/agent-registration.json', (_req, res) => {
  res.sendFile(new URL('../public/agent-registration.json', import.meta.url).pathname);
});

app.post('/v1/logo', async (req, res) => {
  try {
    requireRecipient();
    requireOpenAI();

    const parsed = LogoRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'bad_request', details: parsed.error.flatten() });
    }

    const body = parsed.data;
    const spec = buildLogoSpec(body);
    const prompts = buildPrompts(spec); // 3 prompts => 3 candidates

    const requestHash = hashRequest({ body, spec, prompts });

    // Idempotent return if we already fulfilled this exact request.
    if (jobs.has(requestHash)) {
      return res.status(200).json(jobs.get(requestHash));
    }

    const accepts = buildAccepts({
      network: config.payment.network,
      asset: config.payment.asset,
      recipient: config.payment.recipient,
      amountUsdc: config.payment.priceUsdc,
      resource: 'POST /v1/logo',
      description: 'Generate 3 logo icon candidates (transparent PNG)'
    });

    // Payment verification
    const verification = await verifyPayment({ headers: req.headers, accepts, config });
    if (!verification.ok) {
      const paymentId = newPaymentId();
      res.set('X-PAYMENT-ACCEPTS', 'true');
      return res.status(402).json(paymentRequiredResponse({ paymentId, accepts }));
    }

    const proofKey = `tx:${verification.txHash}`;
    if (usedPaymentProofs.has(proofKey)) {
      return res.status(409).json({ error: 'payment_proof_reused' });
    }

    // Generate images
    const generator = new OpenAIImageGenerator({
      apiKey: config.openai.apiKey,
      model: config.openai.imageModel
    });

    const { images } = await generator.generateIconCandidates({ prompts, size: 1024 });

    // Post-process + export sizes
    const candidates = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const sizes = await exportSizes(img.png, [1024, 512, 256]);
      const sha = (b) => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');

      candidates.push({
        index: i,
        prompt: img.prompt,
        files: [
          {
            name: `logo_${i + 1}_1024.png`,
            contentType: 'image/png',
            size: 1024,
            transparent: true,
            sha256: sha(sizes[1024]),
            dataBase64: sizes[1024].toString('base64')
          },
          {
            name: `logo_${i + 1}_512.png`,
            contentType: 'image/png',
            size: 512,
            transparent: true,
            sha256: sha(sizes[512]),
            dataBase64: sizes[512].toString('base64')
          },
          {
            name: `logo_${i + 1}_256.png`,
            contentType: 'image/png',
            size: 256,
            transparent: true,
            sha256: sha(sizes[256]),
            dataBase64: sizes[256].toString('base64')
          }
        ]
      });
    }

    usedPaymentProofs.add(proofKey);

    const result = {
      status: 'fulfilled',
      pricing: {
        network: config.payment.network,
        asset: config.payment.asset,
        price: config.payment.priceUsdc
      },
      requestHash,
      candidates
    };

    jobs.set(requestHash, result);
    return res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, 'POST /v1/logo failed');
    return res.status(500).json({ error: 'internal_error', message: err?.message || String(err) });
  }
});

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'logo-agent listening');
});
