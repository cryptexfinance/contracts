import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "optimism") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();
		const name = process.env.NAME;
		const symbol = process.env.SYMBOL;

		let orchestrator = await deployments.get("OptimisticOrchestrator");

		let TCAP;
		try {
			TCAP = await deployments.get("TCAP");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"TCAP",
				{ from: deployer },
				"TCAP",
				name,
				symbol,
				0,
				orchestrator.address
			);
			TCAP = await deployments.get("TCAP");
			if (deployResult.newlyDeployed) {
				log(`TCAP deployed at ${TCAP.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["TCAP"];
