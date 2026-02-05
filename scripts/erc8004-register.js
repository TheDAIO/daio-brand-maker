import { readFile } from 'node:fs/promises';
import { ethers } from 'ethers';
import { config, requireErc8004Signer } from '../src/config.js';
import { logger } from '../src/logger.js';

async function main() {
  requireErc8004Signer();
  if (!config.erc8004.agentUri) throw new Error('AGENT_URI must be set (tokenURI for agent-registration.json)');
  if (!config.payment.baseRpcUrl) throw new Error('BASE_RPC_URL must be set (for Base chain)');

  const abiPath = new URL('../abis/IdentityRegistry.json', import.meta.url);
  const abi = JSON.parse(await readFile(abiPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(config.payment.baseRpcUrl);
  const wallet = new ethers.Wallet(config.erc8004.privateKey, provider);

  const identity = new ethers.Contract(config.erc8004.identityRegistry, abi, wallet);

  logger.info(
    {
      chainId: config.erc8004.chainId,
      identityRegistry: config.erc8004.identityRegistry,
      agentUri: config.erc8004.agentUri,
      from: wallet.address
    },
    'Registering agent on ERC-8004 IdentityRegistry'
  );

  // Overload: register(string)
  const tx = await identity['register(string)'](config.erc8004.agentUri);
  logger.info({ hash: tx.hash }, 'Sent register tx');

  const receipt = await tx.wait();
  logger.info({ hash: tx.hash, status: receipt.status }, 'Register tx confirmed');

  // Parse Registered event to get agentId
  const iface = new ethers.Interface(abi);
  let agentId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'Registered') {
        agentId = parsed.args.agentId?.toString?.() ?? String(parsed.args.agentId);
        break;
      }
    } catch {
      // ignore
    }
  }

  if (!agentId) {
    logger.warn('Could not parse Registered event; check receipt logs in explorer');
  } else {
    logger.info({ agentId }, 'Agent registered');
    logger.info(
      'Next: update your agent-registration.json registrations[0].agentId with this value, and (optionally) set/verify agentWallet.'
    );
  }
}

main().catch((err) => {
  logger.error({ err }, 'erc8004 register failed');
  process.exit(1);
});
