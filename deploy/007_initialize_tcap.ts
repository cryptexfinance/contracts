import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
require("dotenv").config();

module.exports = async ({deployments}: any) => {
	if (
		buidlerArguments.network === "rinkeby" ||
		buidlerArguments.network === "ropsten" ||
		buidlerArguments.network === "ganache"
	) {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let BTCHandler = await deployments.get("BTCVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let tcap = await deployments.get("TCAP");
		const timelock = process.env.TIMELOCK;

		let orchestrator = await ethersBuidler.getContractAt(
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
