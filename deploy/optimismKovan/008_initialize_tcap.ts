import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (hardhatArguments.network === "optimismKovan") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("OptimisticOrchestrator");
		let tcap = await deployments.get("TCAP");

		let orchestrator = await ethershardhat.getContractAt(
			"OptimisticOrchestrator",
			OrchestratorDeployment.address
		);

		let tcapContract = await ethershardhat.getContractAt("TCAP", tcap.address);
		console.log("DAI Vault", await tcapContract.vaultHandlers(DAIHandler.address));
		console.log("WETHHandler Vault", await tcapContract.vaultHandlers(WETHHandler.address));

		console.log(await orchestrator.owner());
		console.log(await orchestrator.ovmL2CrossDomainMessenger());

		console.log("Adding vault Handlers");

		// await orchestrator.addTCAPVault(tcap.address, DAIHandler.address);
		// await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
	}
};
module.exports.tags = ["Initialize"];
