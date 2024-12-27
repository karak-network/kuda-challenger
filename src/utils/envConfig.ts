import dotenv from 'dotenv';
import { cleanEnv, num, str, url } from 'envalid';
import { Chains } from './chains';

dotenv.config();

export const env = cleanEnv(process.env, {
  AGGREGATOR_URL: str(),
  CHALLENGER_PRIVATE_KEY: str(),
  CELESTIA_RPC_URL: str(),
  CELESTIA_AUTH_TOKEN: str(),
  CHAIN_ID: num({ choices: Chains.map((chain) => chain.id) }),
  KUDA_RPC_URL: url(),
  BEACON_RPC_URL: url(),
  KUDA_CONTRACT_ADDRESS: str(),
});
