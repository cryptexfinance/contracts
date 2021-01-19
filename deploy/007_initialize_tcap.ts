import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (
		hardhatArguments.network === "rinkeby" ||
		hardhatArguments.network === "ropsten" ||
		hardhatArguments.network === "ganache"
	) {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let BTCHandler = await deployments.get("BTCVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let tcap = await deployments.get("TCAP");
		const timelock = process.env.TIMELOCK;

		let orchestrator = await ethershardhat.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("adding vault Handlers");
		await orchestrator.addTCAPVault(tcap.address, DAIHandler.address);
		await orchestrator.addTCAPVault(tcap.address, BTCHandler.address);
		await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
		await orchestrator.transferOwnership(timelock);
	}
};
module.exports.tags = ["Initialize"];
