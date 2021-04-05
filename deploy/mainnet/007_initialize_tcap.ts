import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "hardhat" && initial_run) {
        let DAIHandler = await deployments.get("DAIVaultHandler");
        let BTCHandler = await deployments.get("WBTCVaultHandler");
        let WETHHandler = await deployments.get("WETHVaultHandler");
        let OrchestratorDeployment = await deployments.get("Orchestrator");
        let tcap = await deployments.get("TCAP");

        let orchestrator = await ethershardhat.getContractAt(
            "Orchestrator",
            OrchestratorDeployment.address
        );

        console.log("Adding vault Handlers");
        await orchestrator.addTCAPVault(tcap.address, DAIHandler.address);
        await orchestrator.addTCAPVault(tcap.address, BTCHandler.address);
        await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
    }
};
module.exports.tags = ["Initialize"];
