import { Hex } from "viem";
import { env } from "./utils/envConfig";

interface Sidecar {
    index: number;
    blob: Hex;
    kzg_commitment: Hex;
    kzg_proof: Hex;
}

export async function isInvalid4844Commitment(slot: bigint, commitment: string): Promise<boolean> {
    const sidecars = await getSidecars(slot);
    return !sidecars.some((sidecar) => sidecar.kzg_commitment === commitment);
}

export async function getSidecars(slot: bigint): Promise<Sidecar[]> {
    const response = await fetch(env.BEACON_RPC_URL + '/eth/v1/beacon/blob_sidecars/' + slot);
    const sidecars = (await response.json())['data'] as Sidecar[];
    return sidecars;
}
