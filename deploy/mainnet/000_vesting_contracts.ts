import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const treasury: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const ethers = hre.ethers;
    const provider = ethers.getDefaultProvider();
    const blockN = await provider.getBlockNumber();
    const currentBlock = await provider.getBlock(blockN);

    if (hardhatArguments.network === "mainnet") {
        const teamTreasury = await deployments.getOrNull("TeamTreasuryVester");
        const advisorTreasury1 = await deployments.getOrNull(
            "AdvisorTreasuryVester1"
        );
        const advisorTreasury2 = await deployments.getOrNull(
            "AdvisorTreasuryVester2"
        );
        const { log } = deployments;
        if (!teamTreasury && !advisorTreasury1 && !advisorTreasury2) {
            const ethers = hre.ethers;

            const namedAccounts = await hre.getNamedAccounts();
            let ctxDeployment = await deployments.get("Ctx");

            const oneYear = 1649282061; // Wednesday, April 6, 2022 5:54:21 PM
            const ctx = ctxDeployment.address;
            const vestingBegin = 1621294508; // 5/17/2021, 5:35:08 PM
            const vestingEnd = 1712440461; // 4/6/2024, 5:54:21 PM
            const vestingCliff = oneYear;
            const vestingAmountTeam = "1500000000000000000000000"; // 1.5M CTX Wei
            const vestingAmountAdvisor = "25000000000000000000000"; // 25k CTX Wei
            const teamAddress = "0xa70b638b70154edfcbb8dbbbd04900f328f32c35";
            const advisorAddress1 =
                "0xf4b0498e71485717f6f9b6117672c19a0dba5100"; // zak.eth
            const advisorAddress2 = teamAddress; // Missing Don's address, using team address for now and will transfer ownership later.

            const teamDeployment = await deployments.deploy(
                "TeamTreasuryVester",
                {
                    contract: "TreasuryVester",
                    from: namedAccounts.deployer,
                    args: [
                        ctx,
                        teamAddress,
                        vestingAmountTeam,
                        vestingBegin,
                        vestingCliff,
                        vestingEnd,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                    nonce: 43,
                }
            );

            log(
                `Team Vestingdeployed at ${teamDeployment.address} for ${teamDeployment.receipt?.gasUsed}`
            );

            const advisor1Deployment = await deployments.deploy(
                "AdvisorTreasuryVester1",
                {
                    contract: "TreasuryVester",
                    from: namedAccounts.deployer,
                    args: [
                        ctx,
                        advisorAddress1,
                        vestingAmountAdvisor,
                        vestingBegin,
                        vestingCliff,
                        vestingEnd,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                    nonce: 44,
                }
            );

            log(
                `Team Vestingdeployed at ${advisor1Deployment.address} for ${advisor1Deployment.receipt?.gasUsed}`
            );

            const advisor2Deployment = await deployments.deploy(
                "AdvisorTreasuryVester2",
                {
                    contract: "TreasuryVester",
                    from: namedAccounts.deployer,
                    args: [
                        ctx,
                        advisorAddress2,
                        vestingAmountTeam,
                        vestingBegin,
                        vestingCliff,
                        vestingEnd,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                    nonce: 45,
                }
            );

            log(
                `Team Vestingdeployed at ${advisor2Deployment.address} for ${advisor2Deployment.receipt?.gasUsed}`
            );
        } else {
            log("Vesting already deployed");
        }
    }
};
export default treasury;
