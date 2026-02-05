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
        size: `${size}x${size}`,
        response_format: 'b64_json'
      })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`OpenAI image generation failed: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI response missing b64_json');

    return Buffer.from(b64, 'base64');
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
