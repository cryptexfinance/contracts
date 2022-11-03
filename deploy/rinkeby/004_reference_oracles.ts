import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "rinkeby") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let TCAPOracle, BTCOracle, WETHOracle, DAIOracle, USDCOracle;
		let oracleAddress = process.env.TCAP_ORACLE as string;
		try {
			TCAPOracle = await deployments.get("TCAPOracle");
		} catch (error: any) {
			log(error.message);
			const deployResult = await deployIfDifferent(
				["data"],
				"TCAPOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				deployer
			);
			TCAPOracle = await deployments.get("TCAPOracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${TCAPOracle.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
		try {
			BTCOracle = await deployments.get("BTCOracle");
		} catch (error: any) {
			log(error.message);
			oracleAddress = "0xECe365B379E1dD183B20fc5f022230C044d51404";

			const deployResult = await deployments.deploy("BTCOracle", {
				from: deployer,
				contract: "ChainlinkOracle",
				args: [oracleAddress, deployer],
				skipIfAlreadyDeployed: true,
			});

			BTCOracle = await deployments.get("BTCOracle");
			if (deployResult.newlyDeployed) {
				log(
					`Price Feed Oracle deployed at ${BTCOracle.address} for ${deployResult.receipt.gasUsed}`
				);
			}
		}
		try {
			WETHOracle = await deployments.get("WETHOracle");
		} catch (error: any) {
			log(error.message);
			let oracleAddress = process.env.ETH_ORACLE as string;
			const deployResult = await deployIfDifferent(
				["data"],
				"WETHOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				deployer
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
			let oracleAddress = process.env.DAI_ORACLE as string;
			const deployResult = await deployIfDifferent(
				["data"],
				"DAIOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				deployer
			);
			DAIOracle = await deployments.get("DAIOracle");
			if (deployResult.newlyDeployed) {
				log(
					`Price Feed Oracle deployed at ${DAIOracle.address} for ${deployResult.receipt.gasUsed}`
				);
			}
		}

		try {
			USDCOracle = await deployments.get("USDCOracle");
		} catch (error: any) {
			log(error.message);
			let oracleAddress = "0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB";
			const deployResult = await deployIfDifferent(
				["data"],
				"USDCOracle",
				{ from: deployer },
				"ChainlinkOracle",
				oracleAddress,
				deployer
			);
			USDCOracle = await deployments.get("USDCOracle");
			if (deployResult.newlyDeployed) {
				log(
					`Price Feed Oracle deployed at ${USDCOracle.address} for ${deployResult.receipt.gasUsed}`
				);
			}
		}
	}
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
