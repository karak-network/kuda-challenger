import { UUID } from 'crypto';
import { bytesToHex, Hex } from 'viem';
import { parse as parseUUID } from 'uuid';

export function uuidToHex(uuid: UUID): Hex {
  return bytesToHex(parseUUID(uuid));
}
