import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
	if (hardhatArguments.network === "goerli" && initial_run) {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let orchestrator;
		try {
			orchestrator = await deployments.get("Orchestrator");
		} catch (error: any) {
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"Orchestrator",
					{ from: deployer, gas: 8000000 },
					"Orchestrator",
					deployer
				);
				orchestrator = await deployments.get("Orchestrator");
				if (deployResult.newlyDeployed) {
					log(
						`Orchestrator deployed at ${orchestrator.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error: any) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["Orchestrator"];
