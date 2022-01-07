import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (hardhatArguments.network === "mumbai") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("PolygonOrchestrator");
		let tcap = await deployments.get("TCAP");

		let orchestrator = await ethershardhat.getContractAt(
			"OptimisticOrchestrator",
			OrchestratorDeployment.address
		);

		let tcapContract = await ethershardhat.getContractAt("TCAP", tcap.address);
		console.log("DAI Vault", await tcapContract.vaultHandlers(DAIHandler.address));
		console.log("WETHHandler Vault", await tcapContract.vaultHandlers(WETHHandler.address));
	}
};
module.exports.tags = ["Initialize"];
module.exports.dependencies = ['DAIVaultHandler', 'WETHVaultHandler'];
