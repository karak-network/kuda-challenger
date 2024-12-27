import { env } from "./utils/envConfig";

export const isInvalidCelestiaCommitment = async (namespace: string, height: number, commitment: string): Promise<boolean> => {
    const requestBody = {
        id: 1,
        jsonrpc: '2.0',
        method: 'blob.Get',
        params: [height, namespace, commitment],
    };

    try {
        const response = await fetch(env.CELESTIA_RPC_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.CELESTIA_AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data['error'] != undefined) return true;
        return false;
    } catch (error) {
        console.error('Error fetching data:', error);
        return false;
    }
};
