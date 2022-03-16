import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const TCAP: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const optimisticOrchestrator = await deployments.getOrNull("OptimisticOrchestrator");
		const tcap = await deployments.getOrNull("TCAP");

		if (optimisticOrchestrator && !tcap) {
			const name = "Total Crypto Market Cap";
			const symbol = "TCAP";
			const cap = 0;
			const orchestratorAddress = optimisticOrchestrator.address;

			const deployResult = await deployments.deploy("TCAP", {
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [name, symbol, cap, orchestratorAddress],
			});
			log(`TCAP deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("TCAP already deployed or Orchestrator not found");
		}
	}
};

export default TCAP;
