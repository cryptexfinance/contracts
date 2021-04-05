import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "hardhat" && initial_run) {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();
        const name = process.env.NAME;
        const symbol = process.env.SYMBOL;
        let cap = process.env.CAP;

        let orchestrator = await deployments.get("Orchestrator");

        let TCAP;
        try {
            TCAP = await deployments.get("TCAP");
        } catch (error) {
            log(error.message);
            const deployResult = await deployIfDifferent(
                ["data"],
                "TCAP",
                { from: deployer, gas: 4000000 },
                "TCAP",
                name,
                symbol,
                cap,
                orchestrator.address
            );
            TCAP = await deployments.get("TCAP");
            if (deployResult.newlyDeployed) {
                log(
                    `TCAP deployed at ${TCAP.address} for ${deployResult.receipt.gasUsed}`
                );
            }
        }
    }
};
module.exports.tags = ["TCAP"];
