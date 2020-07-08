import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let Oracle, ChainlinkOracle, ETHAggregator, StableAggregator;
		try {
			Oracle = await deployments.get("Oracle");
		} catch (error) {
			log(error.message);

			const price = process.env.PRICE as string;
			const deployResult = await deployIfDifferent(
				["data"],
				"Oracle",
				{from: deployer, gas: 4000000},
				"Oracle",
				ethers.utils.parseEther(price)
			);
			Oracle = await deployments.get("Oracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${Oracle.address} for ${deployResult.receipt.gasUsed}`);
			}
			try {
				ETHAggregator = await deployments.get("ETHAggregator");
			} catch (error) {
				log(error.message);

				const deployResult = await deployIfDifferent(
					["data"],
					"ETHAggregator",
					{from: deployer, gas: 4000000},
					"AggregatorInterface"
				);
				ETHAggregator = await deployments.get("ETHAggregator");
				if (deployResult.newlyDeployed) {
					log(
						`AggregatorInterface deployed at ${ETHAggregator.address} for ${deployResult.receipt.gasUsed}`
					);
				}
				try {
					ChainlinkOracle = await deployments.get("ChainlinkOracleETH");
				} catch (error) {
					log(error.message);

					const deployResult = await deployIfDifferent(
						["data"],
						"ChainlinkOracleETH",
						{from: deployer, gas: 4000000},
						"ChainlinkOracle",
						ETHAggregator.address
					);
					ChainlinkOracle = await deployments.get("ChainlinkOracleETH");
					if (deployResult.newlyDeployed) {
						log(
							`Price Feed Oracle deployed at ${ChainlinkOracle.address} for ${deployResult.receipt.gasUsed}`
						);
					}
				}
			}
			try {
				StableAggregator = await deployments.get("AggregatorInterfaceStable");
			} catch (error) {
				log(error.message);

				const deployResult = await deployIfDifferent(
					["data"],
					"AggregatorInterfaceStable",
					{from: deployer, gas: 4000000},
					"AggregatorInterfaceStable"
				);
				StableAggregator = await deployments.get("AggregatorInterfaceStable");
				if (deployResult.newlyDeployed) {
					log(
						`AggregatorInterface deployed at ${StableAggregator.address} for ${deployResult.receipt.gasUsed}`
					);
				}
				try {
					ChainlinkOracle = await deployments.get("ChainlinkOracleStable");
				} catch (error) {
					log(error.message);

					const deployResult = await deployIfDifferent(
						["data"],
						"ChainlinkOracleStable",
						{from: deployer, gas: 4000000},
						"ChainlinkOracle",
						StableAggregator.address
					);
					ChainlinkOracle = await deployments.get("ChainlinkOracleStable");
					if (deployResult.newlyDeployed) {
						log(
							`Price Feed Oracle deployed at ${ChainlinkOracle.address} for ${deployResult.receipt.gasUsed}`
						);
					}
				}
			}
		}
	}
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
