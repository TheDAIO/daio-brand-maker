import 'dotenv/config';

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  payment: {
    network: process.env.PAYMENT_NETWORK || 'base',
    asset: process.env.PAYMENT_ASSET || 'USDC',
    priceUsdc: Number(process.env.PRICE_USDC || 10),
    recipient: process.env.PAYMENT_RECIPIENT || '',
    baseRpcUrl: process.env.BASE_RPC_URL || '',
    usdcContractBase: process.env.USDC_CONTRACT_BASE || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
  },

  erc8004: {
    chainId: Number(process.env.ERC8004_CHAIN_ID || 8453),
    identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY || '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    privateKey: process.env.ERC8004_PRIVATE_KEY || '',
    agentUri: process.env.AGENT_URI || ''
  },

  strict: {
    // If true, refuse to start unless critical env vars are set
    requireRecipient: Boolean(process.env.REQUIRE_RECIPIENT === 'true')
  }
};

export function requireRecipient() {
  if (!config.payment.recipient) throw new Error('PAYMENT_RECIPIENT must be set');
}

export function requireOpenAI() {
  if (!config.openai.apiKey) throw new Error('OPENAI_API_KEY must be set');
}

export function requireErc8004Signer() {
  if (!config.erc8004.privateKey) throw new Error('ERC8004_PRIVATE_KEY must be set');
}
