import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "goerli") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();
		
		let TCAPOracle, BTCOracle, WETHOracle, DAIOracle, USDCOracle;
		let oracleAddress = "0xaaf6c376017869d9169cd693aeccf2ec541b7517";
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
			oracleAddress = "0xA39434A63A52E749F02807ae27335515BA4b07F7";

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
			let oracleAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";
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
			let oracleAddress = "0x0d79df66BE487753B02D015Fb622DED7f0E9798d";
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
			let oracleAddress = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7";
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
