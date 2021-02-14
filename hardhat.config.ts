/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "hardhat-gas-reporter";

const mnemonic = process.env.MNENOMIC as string;
const ganacheMnemonic = process.env.GANACHEMNENOMIC as string;

const config: HardhatUserConfig = {
	//@ts-ignore
	namedAccounts: {
		deployer: {
			default: 0, // here this will by default take the first account as deployer
		},
	},
	solidity: {
		version: "0.7.5",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {},
		ganache: {
			url: "http://127.0.0.1:8545",
			accounts: { mnemonic: ganacheMnemonic },
		},
		ropsten: {
			url: process.env.ROPSTEN_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		rinkeby: {
			url: process.env.RINKEBY_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		goerli: {
			url: process.env.GOERLI_API_URL,
			accounts: { mnemonic: mnemonic },
		},
	},
	etherscan: {
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
