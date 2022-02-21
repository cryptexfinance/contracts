import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "mumbai") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        let TCAPOracle, WMATICOracle, DAIOracle, wBTCOracle;

        const timelock = process.env.GOERLI_TIMELOCK_ADDRESS as string;
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
                timelock
            );
            TCAPOracle = await deployments.get("TCAPOracle");
            if (deployResult.newlyDeployed) {
                log(
                    `Oracle deployed at ${TCAPOracle.address} for ${deployResult.receipt.gasUsed}`
                );
            }
            try {
                WMATICOracle = await deployments.get("WMATICOracle");
            } catch (error) {
                log(error.message);
                let oracleAddress =
                    "0x0715A7794a1dc8e42615F059dD6e406A6594651A";
                const deployResult = await deployIfDifferent(
                    ["data"],
                    "WMATICOracle",
                    { from: deployer },
                    "ChainlinkOracle",
                    oracleAddress,
                    timelock
                );
                WMATICOracle = await deployments.get("WMATICOracle");
                if (deployResult.newlyDeployed) {
                    log(
                        `Price Feed Oracle deployed at ${WMATICOracle.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
                try {
                    DAIOracle = await deployments.get("DAIOracle");
                } catch (error) {
                    log(error.message);
                    let oracleAddress =
                        "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046";
                    const deployResult = await deployIfDifferent(
                        ["data"],
                        "DAIOracle",
                        { from: deployer },
                        "ChainlinkOracle",
                        oracleAddress,
                    		timelock
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
        try {
						let wBTCOracle = await deployments.get("WBTCOracle");
				} catch (error) {
						log(error.message);
						let oracleAddress =
								"0x007A22900a3B98143368Bd5906f8E17e9867581b";
						const deployResult = await deployIfDifferent(
								["data"],
								"WBTCOracle",
								{ from: deployer },
								"ChainlinkOracle",
								oracleAddress,
								timelock
						);
						wBTCOracle = await deployments.get("WBTCOracle");
						if (deployResult.newlyDeployed) {
								log(
										`Price Feed Oracle deployed at ${wBTCOracle.address} for ${deployResult.receipt.gasUsed}`
								);
						}
				}
    }
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
