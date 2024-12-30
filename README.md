# KUDA Challenger

Challenger for the Karak Universal Data Availability (KUDA) DSS.
It polls the aggregator for DA tasks that have passed the challenge period time and submits a challenge to the KUDA contract if the data is not available or incorrect, according to the commitment.
Provers can counter-challenge the challenger by submitting a proof that the data is available and correct.

**Note:** There is a associated bond that the challenger must deposit in order to submit a challenge. This bond is returned if the challenge is successful, but is forfeited if the challenge is unsuccessful.

## Download the Docker image

```bash
docker pull ghcr.io/karak-network/kuda-challenger:latest
```

## Running the prover

To run the challenger, you can simply provide the following environment variables to the docker container:

```bash
AGGREGATOR_URL
CHALLENGER_PRIVATE_KEY
CELESTIA_RPC_URL
CELESTIA_AUTH_TOKEN
CHAIN_ID
KUDA_RPC_URL
BEACON_RPC_URL
KUDA_CONTRACT_ADDRESS
```
