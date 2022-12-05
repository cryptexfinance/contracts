import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    if (hardhatArguments.network === "arbitrumGoerli") {
        let WETHHandler = await deployments.get("WETHVaultHandler");
        let OrchestratorDeployment = await deployments.get("ArbitrumOrchestrator");
        let tcap = await deployments.get("TCAP");

        let orchestrator = await ethershardhat.getContractAt(
            "ArbitrumOrchestrator",
            OrchestratorDeployment.address
        );

//         console.log("Adding vault Handlers");
//         await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
    }
};

module.exports.tags = ["Initialize"];
