import { hardhatArguments } from "hardhat";
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "optimismKovan") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let orchestrator;
		try {
			orchestrator = await deployments.get("OptimisticOrchestrator");
		} catch (error) {
			try {
				const crossDomain = "0x4200000000000000000000000000000000000007";
				const timelock = "0x71cEA4383F7FadDD1F17c960DE7b6A32bFDAf139"; // Testing address for now
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
