import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    if (hardhatArguments.network === "arbitrumGoerli") {
        let WETHHandler = await deployments.get("WETHVaultHandler");
        let OrchestratorDeployment = await deployments.get("ArbitrumOrchestrator");
        let tcap = await deployments.get("TCAP");
        const l2MessageExecutorProxyDeployResult = await deployments.get("L2MessageExecutorProxy");

        let orchestrator = await ethershardhat.getContractAt(
            "ArbitrumOrchestrator",
            OrchestratorDeployment.address
        );

        console.log("Adding vault Handlers");
        let tx = await orchestrator.addTCAPVault(tcap.address, WETHHandler.address);
        await tx.wait();
        console.log("Added vault Handlers");
//         Transfer Orchestrator Ownership to the DAO
        tx = await orchestrator.transferOwnership(l2MessageExecutorProxyDeployResult.address);
        await tx.wait();
        console.log("Transferred Ownership to DAO");
    }
};

module.exports.tags = ["Initialize"];
