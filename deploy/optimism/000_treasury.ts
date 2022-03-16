import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const OptimisticTreasury: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const optimisticTreasury = await deployments.getOrNull("OptimisticTreasury");

		if (!optimisticTreasury) {
			const owner = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8"; // Mainnet Timelock
			const ovmL2CrossDomainMessenger = "0x4200000000000000000000000000000000000007";

			const deployResult = await deployments.deploy("OptimisticTreasury", {
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [owner, ovmL2CrossDomainMessenger],
			});
			log(
				`OptimisticTreasury deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
			);
		} else {
			log("OptimisticTreasury already deployed or Orchestrator not found");
		}
	}
};

export default OptimisticTreasury;
