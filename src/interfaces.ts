import { UUID } from 'crypto';
import { Address, Hex } from 'viem';
import { v4 } from 'uuid';

export interface Task {
  id: number;
  taskId: UUID;
  clientAddress: Address;
  rewardToken: Address;
  rewardAmount: bigint;
  acceptableDaLayers: string[];
  status: string;
  reason: string;
  winnerOperator: Address;
  daLayer: string;
  commitment: Hex;
  nameSpace: string | null;
  createdAt: Date;
  updatedAt: Date;
  operatorTaskSubmissionTime: number;
  aggregatorSignature: Hex;
}
