import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "optimismKovan") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let TCAPOracle, WETHOracle, DAIOracle;

		const timelock = "0x71cEA4383F7FadDD1F17c960DE7b6A32bFDAf139"; // Testing address for now

		const tcapAggregator = await deployments.getOrNull("AggregatorInterfaceTCAP");

		try {
			TCAPOracle = await deployments.get("TCAPOracle");
		} catch (error: any) {
			log(error.message);
			let oracleAddress = tcapAggregator.address;
			const deployResult = await deployIfDifferent(
				"TCAPOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				timelock
			);
			TCAPOracle = await deployments.get("TCAPOracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${TCAPOracle.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		try {
			WETHOracle = await deployments.get("WETHOracle");
		} catch (error: any) {
			log(error.message);
			let oracleAddress = "0xCb7895bDC70A1a1Dce69b689FD7e43A627475A06";
			const deployResult = await deployIfDifferent(
				"WETHOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				timelock
			);
			WETHOracle = await deployments.get("WETHOracle");
			if (deployResult.newlyDeployed) {
				log(
					`Price Feed Oracle deployed at ${WETHOracle.address} for ${deployResult.receipt.gasUsed}`
				);
			}
		}

		try {
			DAIOracle = await deployments.get("DAIOracle");
		} catch (error: any) {
			log(error.message);
			let oracleAddress = "0xa18B00759bF7659Ad47d618734c8073942faFdEc";
			const deployResult = await deployIfDifferent(
				"DAIOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				timelock
			);
			DAIOracle = await deployments.get("DAIOracle");
			if (deployResult.newlyDeployed) {
				log(
					`Price Feed Oracle deployed at ${DAIOracle.address} for ${deployResult.receipt.gasUsed}`
				);
			}
		}
	}
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
