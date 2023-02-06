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
import "hardhat-tracer";

const mnemonic = process.env.DEPLOYER_MNEMONIC as string;
const ganacheMnemonic = process.env.GANACHE_MNEMONIC as string;

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
		hardhat: {
			forking: {
				url: process.env.MAINNET_API_URL as string,
			},
		},
		mainnet: {
			url: process.env.MAINNET_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		polygon: {
			url: process.env.POLYGON_API_URL,
			accounts: { mnemonic: mnemonic },
		},
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
		kovan: {
			url: process.env.KOVAN_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		optimismKovan: {
			url: process.env.OPTIMISM_KOVAN_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		optimism: {
			url: process.env.OPTIMISM_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		mumbai: {
			url: process.env.MUMBAI_API_URL,
			accounts: { mnemonic: mnemonic },
		},
		arbitrumGoerli: {
			url: process.env.ARBITRUM_GOERLI_API_URL,
			accounts: { mnemonic: mnemonic },
		},
        arbitrum: {
			url: process.env.ARBITRUM_API_URL,
			accounts: { mnemonic: mnemonic },
		}
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY as string,
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS == "true",
		currency: "USD",
		gasPrice: 152,
		coinmarketcap: process.env.COIN_API as string,
	},
	mocha: {
		timeout: 100000,
	},
    verify: {
        etherscan: {
            apiKey: process.env.ETHERSCAN_API_KEY as string,
        }
    }
};

export default config;
