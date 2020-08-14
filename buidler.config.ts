require("dotenv").config();
import {BuidlerConfig, usePlugin} from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("buidler-deploy");
usePlugin("solidity-coverage");
usePlugin("buidler-gas-reporter");

const mnemonic = process.env.MNENOMIC as string;
const ganacheMnemonic = process.env.GANACHEMNENOMIC as string;

const config: BuidlerConfig = {
	//@ts-ignore
	namedAccounts: {
		deployer: {
			default: 0, // here this will by default take the first account as deployer
		},
	},
	solc: {
		version: "0.6.8",
		optimizer: {
			enabled: true,
			runs: 200,
		},
	},
	networks: {
		buidlerevm: {},
		ganache: {
			url: "http://127.0.0.1:8545",
			accounts: {mnemonic: ganacheMnemonic},
		},

		rinkeby: {
			url: process.env.RINKEBY_API_URL,
			accounts: {mnemonic: mnemonic},
		},
		goerli: {
			url: process.env.GOERLI_API_URL,
			accounts: {mnemonic: mnemonic},
		},
	},
	etherscan: {
		// The url for the Etherscan API you want to use.
		url: process.env.ETHERSCAN_URL as string,
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: process.env.ETHERSCAN_API_KEY as string,
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS == "true" ? true : false,
		currency: "USD",
		gasPrice: 152,
		coinmarketcap: process.env.COIN_API as string,
	},
};

export default config;
