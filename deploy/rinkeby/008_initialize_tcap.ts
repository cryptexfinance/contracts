import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (hardhatArguments.network === "rinkeby") {
		let hardDAIHandler = await deployments.get("HardDAIVaultHandler");
		let hardUSDCHandler = await deployments.get("HardUSDCVaultHandler");
		let hardETHHandler = await deployments.get("HardETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let tcap = await deployments.get("TCAP");

		let orchestrator = await ethershardhat.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("Adding vault Handlers");
		await orchestrator.addTCAPVault(tcap.address,hardDAIHandler.address);
		await orchestrator.addTCAPVault(tcap.address,hardUSDCHandler.address);
		await orchestrator.addTCAPVault(tcap.address,hardETHHandler.address);
	}
};
module.exports.tags = ["Initialize"];
