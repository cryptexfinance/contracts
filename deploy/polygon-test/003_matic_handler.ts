import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import { ethers } from "ethers";

const maticHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const maticVault = await deployments.getOrNull("MATICVaultHandler");
        const { log } = deployments;
        if (!maticVault) {
            const namedAccounts = await hre.getNamedAccounts();
            const orchestratorDeployment = await deployments.get(
                "Orchestrator"
            );
            const tcapDeployment = await deployments.get("TCAP");
            const tcapOracleDeployment = await deployments.get("TCAPOracle");
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
                "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
            let maticOracle = maticOracleDeployment.address;
            let rewardAddress = ethers.constants.AddressZero;
            let treasury = "0xf77E8426EceF4A44D5Ec8986FB525127BaD32Fd1"; // guardian address

            const maticVaultHandler = await deployments.deploy(
                "MATICVaultHandler",
                {
                    contract: "MATICVaultHandler",
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
                        maticOracle,
                        maticOracle,
                        rewardAddress,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `Matic Vault deployed at ${maticVaultHandler.address} for ${maticVaultHandler.receipt?.gasUsed}`
            );
        } else {
            log("Matic Vault already deployed");
        }
    }
};
export default maticHandler;
