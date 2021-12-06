import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "kovan") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        let TCAPOracle, WETHOracle, DAIOracle;

        const timelock = await deployments.getOrNull("Timelock");
        const tcapAggregator = await deployments.getOrNull(
            "AggregatorInterfaceTCAP"
        );

        try {
            TCAPOracle = await deployments.get("TCAPOracle");
        } catch (error) {
            log(error.message);
            let oracleAddress = tcapAggregator.address;
            const deployResult = await deployIfDifferent(
                ["data"],
                "TCAPOracle",
                { from: deployer },
                "ChainlinkOracle",
                oracleAddress,
                timelock.address
            );
            TCAPOracle = await deployments.get("TCAPOracle");
            if (deployResult.newlyDeployed) {
                log(
                    `Oracle deployed at ${TCAPOracle.address} for ${deployResult.receipt.gasUsed}`
                );
            }
            try {
                WETHOracle = await deployments.get("WETHOracle");
            } catch (error) {
                log(error.message);
                let oracleAddress =
                    "0x9326BFA02ADD2366b30bacB125260Af641031331";
                const deployResult = await deployIfDifferent(
                    ["data"],
                    "WETHOracle",
                    { from: deployer },
                    "ChainlinkOracle",
                    oracleAddress,
                    timelock.address
                );
                WETHOracle = await deployments.get("WETHOracle");
                if (deployResult.newlyDeployed) {
                    log(
                        `Price Feed Oracle deployed at ${WETHOracle.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
                try {
                    DAIOracle = await deployments.get("DAIOracle");
                } catch (error) {
                    log(error.message);
                    let oracleAddress =
                        "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a";
                    const deployResult = await deployIfDifferent(
                        ["data"],
                        "DAIOracle",
                        { from: deployer },
                        "ChainlinkOracle",
                        oracleAddress,
                        timelock.address
                    );
                    DAIOracle = await deployments.get("DAIOracle");
                    if (deployResult.newlyDeployed) {
                        log(
                            `Price Feed Oracle deployed at ${DAIOracle.address} for ${deployResult.receipt.gasUsed}`
                        );
                    }
                }
            }
        }
    }
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
