import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (hardhatArguments.network === "optimism") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("OptimisticOrchestrator");
		let tcap = await deployments.get("TCAP");

		let orchestrator = await ethershardhat.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("Adding vault Handlers");
		await orchestrator.addTCAPVault(tcap.address, DAIHandler.address);
		await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
	}
};
module.exports.tags = ["Initialize"];
