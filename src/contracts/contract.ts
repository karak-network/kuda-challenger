import {
  Address,
  createClient,
  createTestClient,
  extractChain,
  getContract,
  http,
  publicActions,
  walletActions,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { kudaAbi } from './abis/kuda';
import { env } from '../utils/envConfig';

import { ChainId, Chains } from '@/utils/chains';

export const client = createClient({
  //anvil public account
  account: privateKeyToAccount(env.CHALLENGER_PRIVATE_KEY as `0x${string}`),
  chain: extractChain({ chains: Chains, id: env.CHAIN_ID as ChainId }),
  transport: http(env.KUDA_RPC_URL),
})
  .extend(publicActions)
  .extend(walletActions);

export const kudaContractAddress = env.KUDA_CONTRACT_ADDRESS as Address;

export const kudaContract = getContract({
  address: kudaContractAddress as Address,
  abi: kudaAbi,
  client: client,
});
