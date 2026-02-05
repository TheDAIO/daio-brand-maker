import { nanoid } from 'nanoid';

/**
 * Minimal x402-like challenge generator.
 * This is intentionally simple and pluggable: swap with an official x402 middleware when desired.
 */
export function buildAccepts({ network, asset, recipient, amountUsdc, resource, description }) {
  // For USDC: represent amount in base units (6 decimals) for onchain rails.
  const amountBaseUnits = String(Math.round(amountUsdc * 1_000_000));
  return [
    {
      scheme: 'erc20',
      network,
      asset,
      payTo: recipient,
      maxAmountRequired: amountBaseUnits,
      resource,
      description
    }
  ];
}

export function paymentRequiredResponse({ paymentId, accepts }) {
  return {
    error: 'payment_required',
    paymentId,
    accepts
  };
}

export function newPaymentId() {
  return 'pay_' + nanoid();
}

/**
 * MVP payment verification stub.
 *
 * Expected client behavior:
 * 1) Request resource -> 402 with accepts
 * 2) Pay onchain (USDC transfer) -> retry with X-PAYMENT-TX header
 *
 * For production:
 * - verify tx on Base
 * - ensure ERC20 Transfer to recipient for >= price
 * - ensure tx is recent and not previously used (replay protection)
 */
export async function verifyPayment({ headers, _accepts, _config }) {
  const tx = headers['x-payment-tx'];
  if (!tx) {
    return { ok: false, reason: 'missing_x_payment_tx' };
  }

  // TODO: onchain verification.
  // For now, we accept any non-empty tx hash-looking string.
  if (typeof tx !== 'string' || tx.length < 10) {
    return { ok: false, reason: 'invalid_x_payment_tx' };
  }

  return { ok: true, txHash: tx };
}
