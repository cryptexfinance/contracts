import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const treasury: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    let run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "mainnet" && run) {
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
            const vestingBegin = 0; // TODO: ???
            const vestingEnd = 0; // TODO: ???
            const vestingCliff = oneYear;
            const vestingAmountTeam = 5000000000000000000000000; // Wei
            const vestingAmountAdvisor = 8333333333333333333333; // Wei
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
