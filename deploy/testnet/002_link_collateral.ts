import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const linkVaultHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (
        hardhatArguments.network === "rinkeby" ||
        hardhatArguments.network === "ropsten" ||
        hardhatArguments.network === "hardhat"
    ) {
        console.log("=====Rinkeby Deploy=====");
        const { log } = deployments;

        const linkVaultHandler = await deployments.getOrNull(
            "LinkVaultHandler"
        );
        let linkOracle = await deployments.getOrNull("LinkOracle");

        const namedAccounts = await hre.getNamedAccounts();
        const orchestrator = "0x32ac6dBaf90A4C45f160D13B32fDD10D75D09976";
        const divisor = "10000000000";
        const ratio = "200";
        const burnFee = "1";
        const liquidationPenalty = "10";
        const tcapOracle = "0x87388c142a3848F966FBA7Db22663D9CCa7d8a86";
        const tcapAddress = "0x565224C2b5Bdf33f3970d35f82945075F90128F4";
        const linkContract = await deployments.getOrNull("LINK");
        const collateralAddress = linkContract?.address;
        const ethOracle = "0x731Aa03C683Afb292732C31c1d50C491B8d8043F";
        const rewardHandler = ethers.constants.AddressZero;
        const treasury = "0x65a2B1B48b7997a50947E83aaf58E29a54a0B735"; // Timelock
        const linkAggregator = "0xd8bD0a1cB028a31AA859A21A3758685a95dE4623";

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
                `LinkOracle deployed at ${linkOracleDeployment.address} for ${linkOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("LinkOracle already deployed");
        }
        linkOracle = await deployments.getOrNull("LinkOracle");

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

export default linkVaultHandler;
