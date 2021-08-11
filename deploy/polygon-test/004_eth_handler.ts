import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import { ethers } from "ethers";

const ethHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const tcapOracle = await deployments.getOrNull("TCAPOracle");
        const ethOracle = await deployments.getOrNull("ETHOracle");
        const ethVault = await deployments.getOrNull("ETHVaultHandler");

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

        if (!ethOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const aggregator = "0xf9680d99d6c9589e2a93a78a04a279e509205945"; // ETH Chainlink Oracle
            const ethOracleDeployment = await deployments.deploy("ETHOracle", {
                contract: "ChainlinkOracle",
                from: namedAccounts.deployer,
                args: [aggregator],
                skipIfAlreadyDeployed: true,
                log: true,
            });
            log(
                `TCAP Oracle deployed at ${ethOracleDeployment.address} for ${ethOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("TCAP Oracle already deployed");
        }

        if (!ethVault) {
            const namedAccounts = await hre.getNamedAccounts();
            const orchestratorDeployment = await deployments.get(
                "Orchestrator"
            );
            const tcapDeployment = await deployments.get("TCAP");
            const tcapOracleDeployment = await deployments.get("TCAPOracle");
            const ethOracleDeployment = await deployments.get("ETHOracle");
            const maticOracleDeployment = await deployments.get("MATICOracle");

            // Params
            let orchestrator = orchestratorDeployment.address;
            let divisor = "10000000000";
            let ratio = "150";
            let burnFee = "1";
            let liquidationPenalty = "10";
            let tcapOracle = tcapOracleDeployment.address;
            let tcapAddress = tcapDeployment.address;
            let collateralAddress =
                "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
            let maticOracle = maticOracleDeployment.address;
            let ethOracle = ethOracleDeployment.address;
            let rewardAddress = ethers.constants.AddressZero;
            let treasury = "0xf77E8426EceF4A44D5Ec8986FB525127BaD32Fd1"; // guardian address

            const ethVaultHandler = await deployments.deploy(
                "ETHVaultHandler",
                {
                    contract: "ERC20VaultHandler",
                    from: namedAccounts.deployer,
                    args: [
                        orchestrator,
                        divisor,
                        ratio,
                        burnFee,
                        liquidationPenalty,
                        tcapOracle,
                        tcapAddress,
                        collateralAddress,
                        ethOracle,
                        maticOracle,
                        rewardAddress,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `Matic Vault deployed at ${ethVaultHandler.address} for ${ethVaultHandler.receipt?.gasUsed}`
            );
        } else {
            log("Matic Vault already deployed");
        }
    }
};
export default ethHandler;
