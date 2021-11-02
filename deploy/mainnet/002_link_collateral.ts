import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const merkleDistributor: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "mainnet") {
        console.log("=====Mainnet Deploy=====");
        const { log } = deployments;

        // TODO: Deploy Aave Oracle
        // TODO: Deploy Aave Vault
        const linkVaultHandler = await deployments.getOrNull(
            "LinkVaultHandler"
        );
        const linkOracle = await deployments.getOrNull("LinkOracle");

        const namedAccounts = await hre.getNamedAccounts();
        const orchestrator = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
        const divisor = "10000000000";
        const ratio = "200";
        const burnFee = "1";
        const liquidationPenalty = "10";
        const tcapOracle = "0xa4e581BD159B869e8290707A7FBF841fe7FE97b6";
        const tcapAddress = "0x16c52ceece2ed57dad87319d91b5e3637d50afa4";
        const collateralAddress = "0x514910771af9ca656af840dff83e8264ecf986ca";
        const ethOracle = "0x2cFeaf282FE9ae050b210e7BDa65D288C40c6104";
        const rewardHandler = ethers.constants.AddressZero;
        const treasury = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8"; // Timelock
        const linkAggregator = "0x2c1d072e956affc0d435cb7ac38ef18d24d9127c";

        if (!linkOracle) {
            const linkOracleDeployment = await deployments.deploy(
                "LinkOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [linkAggregator, treasury],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `LinkVaultHandler deployed at ${linkOracleDeployment.address} for ${linkOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("LinkVaultHandler already deployed");
        }

        if (!linkVaultHandler && linkOracle) {
            const linkVaultHandlerDeployment = await deployments.deploy(
                "LinkVaultHandler",
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
                        linkOracle.address,
                        ethOracle,
                        rewardHandler,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `LinkVaultHandler deployed at ${linkVaultHandlerDeployment.address} for ${linkVaultHandlerDeployment.receipt?.gasUsed}`
            );
        } else {
            log("LinkVaultHandler already deployed");
        }
    }
};

export default merkleDistributor;
