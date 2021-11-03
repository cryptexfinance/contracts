import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const aaveVaultHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (
        hardhatArguments.network === "rinkeby" ||
        hardhatArguments.network === "ropsten" ||
        hardhatArguments.network === "hardhat"
    ) {
        console.log("=====Rinkeby Deploy=====");
        const { log } = deployments;

        const aaveVaultHandler = await deployments.getOrNull(
            "AaveVaultHandler"
        );
        let aaveOracle = await deployments.getOrNull("AaveOracle");

        const namedAccounts = await hre.getNamedAccounts();
        const orchestrator = "0x32ac6dBaf90A4C45f160D13B32fDD10D75D09976";
        const divisor = "10000000000";
        const ratio = "200";
        const burnFee = "1";
        const liquidationPenalty = "10";
        const tcapOracle = "0x87388c142a3848F966FBA7Db22663D9CCa7d8a86";
        const tcapAddress = "0x565224C2b5Bdf33f3970d35f82945075F90128F4";
        const aaveContract = await deployments.getOrNull("AAVE");
        const collateralAddress = aaveContract?.address;
        const ethOracle = "0x731Aa03C683Afb292732C31c1d50C491B8d8043F";
        const rewardHandler = ethers.constants.AddressZero;
        const treasury = "0x65a2B1B48b7997a50947E83aaf58E29a54a0B735"; // Timelock
        const aaveAggregator = "0xE96C4407597CD507002dF88ff6E0008AB41266Ee";

        if (!aaveOracle) {
            const aaveOracleDeployment = await deployments.deploy(
                "AaveOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [aaveAggregator, treasury],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `AaveOracle deployed at ${aaveOracleDeployment.address} for ${aaveOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("AaveOracle already deployed");
        }
        aaveOracle = await deployments.getOrNull("AaveOracle");

        if (!aaveVaultHandler && aaveOracle) {
            const aaveVaultHandlerDeployment = await deployments.deploy(
                "AaveVaultHandler",
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
                        aaveOracle.address,
                        ethOracle,
                        rewardHandler,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `AaveVaultHandler deployed at ${aaveVaultHandlerDeployment.address} for ${aaveVaultHandlerDeployment.receipt?.gasUsed}`
            );
        } else {
            log("AaveVaultHandler already deployed");
        }
    }
};

export default aaveVaultHandler;
