import { hardhatArguments } from "hardhat";
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "optimism") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let orchestrator;
		try {
			orchestrator = await deployments.get("OptimisticOrchestrator");
		} catch (error) {
			try {
				const crossDomain = "0x4361d0F75A0186C05f971c566dC6bEa5957483fD";
				const timelock = "0xeCfaAE58487B64d777cDc8fb9f9e3B154f5563F1";
				const deployResult = await deployIfDifferent(
					["data"],
					"OptimisticOrchestrator",
					{ from: deployer, gas: 8000000 },
					"OptimisticOrchestrator",
					deployer,
					timelock,
					crossDomain
				);
				orchestrator = await deployments.get("OptimisticOrchestrator");
				if (deployResult.newlyDeployed) {
					log(
						`OptimisticOrchestrator deployed at ${orchestrator.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["OptimisticOrchestrator"];
