# Total Cryptocurrency Market Capitalization Token

[![codecov](https://codecov.io/gh/cryptexglobal/contracts/branch/master/graph/badge.svg?token=BP6UPE7IJ6)](https://codecov.io/gh/cryptexglobal/contracts)

## What is TCAP?

TCAP is the World's First Total Cryptocurrency Market Capitalization Token created by Cryptex Finance. Like a conventional index fund, TCAP gives holders a real-time price exposure to the total cryptocurrency market cap. It's a 150% fully collateralized asset that’s both audited and accurately representative of the entire cryptocurrency complex by total market capitalization.

TCAPs are then minted upon being collateralized by an underlying asset, such as ETH, WBTC or DAI. The TCAP smart contracts are powered by Chainlink decentralized oracles that blend real time total market cap crypto data from seven of the most reputable crypto data providers in the world, subsequently bringing said data on chain to our TCAP smart contract.

For complete documentation please go to [docs.cryptex.finance](https://docs.cryptex.finance).

## Initial setup

Set up your environment file.

```
cp .env.sample .env
# Edit .env as appropriate.
```

Install dependencies.

```
yarn
```

## Running tests

The `.env.sample` file is enough to run the tests as long as you have set up your `MAINNET_API_URL` key.
Make sure that you [build the contracts](#building-the-contracts) before running the tests. Run the test command:

```
yarn test
```

## Running coverage

Run the coverage command:

```
yarn coverage
```

## Building the contracts

Run the build command:

```
yarn build
```

### Install Forge

Run the following command:
```
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Run Forge Tests
```
if [ -d cache ] ; then; rm -rf cache; fi
yarn ftest
```
