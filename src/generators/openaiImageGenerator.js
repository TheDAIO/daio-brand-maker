import { Generator } from './generator.js';

export class OpenAIImageGenerator extends Generator {
  /**
   * @param {{ apiKey: string, model: string }} cfg
   */
  constructor(cfg) {
    super();
    this.apiKey = cfg.apiKey;
    this.model = cfg.model;
  }

  async generateOne({ prompt, size }) {
    // Uses OpenAI Images API. Model name depends on your account; default in .env.example is gpt-image-1.
    // Returns base64-encoded PNG by requesting response_format=b64_json.
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        size: `${size}x${size}`
      })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`OpenAI image generation failed: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json();

    // The Images API may return either base64 (`b64_json`) or a hosted URL (`url`).
    const item = data?.data?.[0];
    if (!item) throw new Error('OpenAI response missing data[0]');

    if (item.b64_json) {
      return Buffer.from(item.b64_json, 'base64');
    }

    if (item.url) {
      const imgResp = await fetch(item.url);
      if (!imgResp.ok) throw new Error(`Failed to download image from OpenAI URL: ${imgResp.status}`);
      const arr = await imgResp.arrayBuffer();
      return Buffer.from(arr);
    }

    throw new Error('OpenAI response missing b64_json/url');
  }

  /** @override */
  async generateIconCandidates({ prompts, size }) {
    const images = [];
    for (const prompt of prompts) {
      const png = await this.generateOne({ prompt, size });
      images.push({ png, prompt });
    }
    return { images };
  }
}
