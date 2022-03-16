import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import { ethers } from "ethers";

const ethHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const tcapOracle = await deployments.getOrNull("TCAPOracle");
        const daiOracle = await deployments.getOrNull("DAIOracle");
        const daiVault = await deployments.getOrNull("DAIVaultHandler");

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

        if (!daiOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const aggregator = "0x4746dec9e833a82ec7c2c1356372ccf2cfcd2f3d"; // ETH Chainlink Oracle
            const daiOracleDeployment = await deployments.deploy("DAIOracle", {
                contract: "ChainlinkOracle",
                from: namedAccounts.deployer,
                args: [aggregator],
                skipIfAlreadyDeployed: true,
                log: true,
            });
            log(
                `TCAP Oracle deployed at ${daiOracleDeployment.address} for ${daiOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("TCAP Oracle already deployed");
        }

        if (!daiVault) {
            const namedAccounts = await hre.getNamedAccounts();
            const orchestratorDeployment = await deployments.get(
                "Orchestrator"
            );
            const tcapDeployment = await deployments.get("TCAP");
            const tcapOracleDeployment = await deployments.get("TCAPOracle");
            const daiOracleDeployment = await deployments.get("DAIOracle");
            const maticOracleDeployment = await deployments.get("MATICOracle");

            // Params
            let orchestrator = orchestratorDeployment.address;
            let divisor = "10000000000";
            let ratio = "200";
            let burnFee = "1";
            let liquidationPenalty = "10";
            let tcapOracle = tcapOracleDeployment.address;
            let tcapAddress = tcapDeployment.address;
            let collateralAddress =
                "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
            let maticOracle = maticOracleDeployment.address;
            let daiOracle = daiOracleDeployment.address;
            let rewardAddress = ethers.constants.AddressZero;
            let treasury = "0xf77E8426EceF4A44D5Ec8986FB525127BaD32Fd1"; // guardian address

            const daiVaultHandler = await deployments.deploy(
                "DAIVaultHandler",
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
                        daiOracle,
                        maticOracle,
                        rewardAddress,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `Matic Vault deployed at ${daiVaultHandler.address} for ${daiVaultHandler.receipt?.gasUsed}`
            );
        } else {
            log("Matic Vault already deployed");
        }
    }
};
export default ethHandler;
