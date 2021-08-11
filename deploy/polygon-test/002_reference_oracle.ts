import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const tcapOracle: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const tcapOracle = await deployments.getOrNull("TCAPOracle");
        const maticOracle = await deployments.getOrNull("MATICOracle");
        const { log } = deployments;

        if (!tcapOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params TODO: complete address
            const aggregator = "0xBb9749B5AD68574C106AC4F9cd5E1c400dbb88C3"; // TCAP Chainlink Oracle

            const tcapOracleDeployment = await deployments.deploy(
                "TCAPOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [aggregator],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `TCAP Oracle deployed at ${tcapOracleDeployment.address} for ${tcapOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("TCAP Oracle already deployed");
        }

        if (!maticOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const aggregator = "0xab594600376ec9fd91f8e885dadf0ce036862de0"; // MATIC Chainlink Oracle
            const maticOracleDeployment = await deployments.deploy(
                "MATICOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [aggregator],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `TCAP Oracle deployed at ${maticOracleDeployment.address} for ${maticOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("TCAP Oracle already deployed");
        }
    }
};
export default tcapOracle;
