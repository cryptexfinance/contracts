import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const OptimisticOrchestrator: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const optimisticOrchestrator = await deployments.getOrNull("OptimisticOrchestrator");

		if (!optimisticOrchestrator) {
			const guardian = "0xb3CBb4de87bdc56825a83498e1b65AbECC3611dC"; // Team multisig
			const owner = namedAccounts.deployer; // TODO: deployer, after setting vaults needs to transfer ownership to timelock
			const ovmL2CrossDomainMessenger = "0x4200000000000000000000000000000000000007";
			const deployResult = await deployments.deploy("OptimisticOrchestrator", {
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [guardian, owner, ovmL2CrossDomainMessenger],
			});
			log(
				`OptimisticOrchestrator deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
			);
		} else {
			log("OptimisticOrchestrator already deployed");
		}
	}
};

export default OptimisticOrchestrator;
