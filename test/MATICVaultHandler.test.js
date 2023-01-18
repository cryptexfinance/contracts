var expect = require("chai").expect;

describe("MATIC Vault", async function () {
    let maticTokenHandler,
        wmaticTokenInstance,
        tcapInstance,
        tcapOracleInstance,
        priceOracleInstance,
        aggregatorTCAPInstance,
        orchestratorInstance;
    let [owner, addr1, addr2, addr3, lq, guardian, treasury] = [];
    let accounts = [];
    let divisor = "10000000000";
    let ratio = "150";
    let burnFee = "1";
    let mintFee = "50";
    let liquidationPenalty = "10";

    before("Set Accounts", async () => {
        let [acc0, acc1, acc3, acc4, acc5, acc6, acc7] = await ethers.getSigners();
        owner = acc0;
        addr1 = acc1;
        addr2 = acc3;
        addr3 = acc4;
        lq = acc5;
        guardian = acc6;
        if (owner && addr1) {
            accounts.push(await owner.getAddress());
            accounts.push(await addr1.getAddress());
            accounts.push(await addr2.getAddress());
            accounts.push(await addr3.getAddress());
            accounts.push(await lq.getAddress());
        }
    });

    it("...should deploy the contract", async () => {
        const orchestrator = await ethers.getContractFactory("Orchestrator");
        orchestratorInstance = await orchestrator.deploy(await guardian.getAddress());
        await orchestratorInstance.deployed();
        expect(orchestratorInstance.address).properAddress;

        const TCAP = await ethers.getContractFactory("TCAP");
        tcapInstance = await TCAP.deploy(
            "Total Market Cap Token",
            "TCAP",
            18,
            orchestratorInstance.address
        );
        await tcapInstance.deployed();

        const collateralOracle = await ethers.getContractFactory("ChainlinkOracle");
        const oracle = await ethers.getContractFactory("ChainlinkOracle");
        const aggregator = await ethers.getContractFactory("AggregatorInterface");
        const aggregatorTcap = await ethers.getContractFactory("AggregatorInterfaceTCAP");
        let aggregatorInstance = await aggregator.deploy();
        aggregatorTCAPInstance = await aggregatorTcap.deploy();
        priceOracleInstance = await collateralOracle.deploy(aggregatorInstance.address, accounts[0]);
        tcapOracleInstance = await oracle.deploy(aggregatorTCAPInstance.address, accounts[0]);
        await priceOracleInstance.deployed();
        const wmatic = await ethers.getContractFactory("WMATIC");
        wmaticTokenInstance = await wmatic.deploy();

        const maticVault = await ethers.getContractFactory("MATICVaultHandler");
        maticTokenHandler = await maticVault.deploy(
            orchestratorInstance.address,
            divisor,
            ratio,
            burnFee,
            mintFee,
            liquidationPenalty,
            tcapOracleInstance.address,
            tcapInstance.address,
            wmaticTokenInstance.address,
            priceOracleInstance.address,
            priceOracleInstance.address,
            await guardian.getAddress(),
            0
        );
        await maticTokenHandler.deployed();
        expect(maticTokenHandler.address).properAddress;

        await orchestratorInstance.addTCAPVault(tcapInstance.address, maticTokenHandler.address);
    });

    it("...should allow the owner to set the treasury address", async () => {
        const abi = new ethers.utils.AbiCoder();
        const target = maticTokenHandler.address;
        const value = 0;
        const signature = "setTreasury(address)";

        const threeDays = 259200;
        const timelock = await ethers.getContractFactory("Timelock");
        const timelockInstance = await timelock.deploy(orchestratorInstance.address, threeDays);

        treasury = timelockInstance.address;
        const data = abi.encode(["address"], [treasury]);
        await expect(
            orchestratorInstance.connect(owner).executeTransaction(target, value, signature, data)
        )
            .to.emit(maticTokenHandler, "NewTreasury")
            .withArgs(orchestratorInstance.address, treasury);

        expect(await maticTokenHandler.treasury()).to.eq(treasury);
    });

    it("...should return the token price", async () => {
        let tcapPrice = await maticTokenHandler.TCAPPrice();
        let totalMarketCap = (await tcapOracleInstance.getLatestAnswer()).mul(10000000000);
        let result = totalMarketCap.div(divisor);
        expect(tcapPrice).to.eq(result);
    });

    it("...should allow users to create a vault", async () => {
        let vaultId = await maticTokenHandler.userToVault(accounts[1]);
        expect(vaultId).eq(0);
        await expect(maticTokenHandler.connect(addr1).createVault())
            .to.emit(maticTokenHandler, "VaultCreated")
            .withArgs(accounts[1], 1);
        vaultId = await maticTokenHandler.userToVault(accounts[1]);
        expect(vaultId).eq(1);
        vaultId = await maticTokenHandler.userToVault(accounts[2]);
        expect(vaultId).eq(0);
        await expect(maticTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
            "VaultHandler::createVault: vault already created"
        );
    });

    it("...should get vault by id", async () => {
        let vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(0);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        vault = await maticTokenHandler.getVault(100);
        expect(vault[0]).to.eq(0);
        expect(vault[1]).to.eq(0);
        expect(vault[2]).to.eq(ethers.constants.AddressZero);
        expect(vault[3]).to.eq(0);
    });

    it("...should allow user to stake wmatic collateral", async () => {
        const amount = ethers.utils.parseEther("375");
        await expect(maticTokenHandler.connect(addr3).addCollateral(amount)).to.be.revertedWith(
            "VaultHandler::vaultExists: no vault created"
        );
        let balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(0);

        await expect(maticTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith("");
        await wmaticTokenInstance.connect(addr1).deposit({ value: amount });
        let wmaticbalance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(wmaticbalance).to.eq(amount);

        await expect(maticTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith("");
        await wmaticTokenInstance.connect(addr1).approve(maticTokenHandler.address, amount);
        balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(amount);

        await expect(maticTokenHandler.connect(addr1).addCollateral(0)).to.be.revertedWith(
            "VaultHandler::notZero: value can't be 0"
        );
        await expect(maticTokenHandler.connect(addr1).addCollateral(amount))
            .to.emit(maticTokenHandler, "CollateralAdded")
            .withArgs(accounts[1], 1, amount);
        let vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(amount);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(amount);
        await wmaticTokenInstance.connect(addr1).deposit({ value: amount });
        await wmaticTokenInstance.connect(addr1).approve(maticTokenHandler.address, amount);
        await maticTokenHandler.connect(addr1).addCollateral(amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(amount.add(amount));
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(amount.add(amount));
    });

    it("...should allow user to stake eth collateral", async () => {
        let balance = await ethers.provider.getBalance(accounts[1]);
        const amount = ethers.utils.parseEther("375");
        let vault = await maticTokenHandler.getVault(1);
        let vaultBalance = vault[1];

        await expect(maticTokenHandler.connect(addr1).addCollateralMATIC()).to.be.revertedWith(
            "MATICVaultHandler::addCollateralMATIC: value can't be 0"
        );

        await expect(maticTokenHandler.connect(addr1).addCollateralMATIC({ value: amount }))
            .to.emit(maticTokenHandler, "CollateralAdded")
            .withArgs(accounts[1], 1, amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(vaultBalance.add(amount));
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);

        let currentBalance = await ethers.provider.getBalance(accounts[1]);
        expect(currentBalance).to.lt(balance.sub(amount));
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(vaultBalance.add(amount));

        await wmaticTokenInstance.connect(addr1).deposit({ value: amount });
        await wmaticTokenInstance.connect(addr1).approve(maticTokenHandler.address, amount);
        await maticTokenHandler.connect(addr1).addCollateral(amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(vaultBalance.add(amount.add(amount)));
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(vaultBalance.add(amount.add(amount)));
    });

    it("...should allow user to retrieve unused collateral on eth", async () => {
        const amount = ethers.utils.parseEther("375");
        const bigAmount = ethers.utils.parseEther("100375");
        let userBalance = await ethers.provider.getBalance(accounts[1]);
        let vault = await maticTokenHandler.getVault(1);
        let vaultBalance = vault[1];
        let contractBalance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        await expect(maticTokenHandler.connect(addr3).removeCollateralMATIC(amount)).to.be.revertedWith(
            "VaultHandler::vaultExists: no vault created"
        );
        await expect(
            maticTokenHandler.connect(addr1).removeCollateralMATIC(bigAmount)
        ).to.be.revertedWith(
            "MATICVaultHandler::removeCollateralMATIC: retrieve amount higher than collateral"
        );
        await expect(maticTokenHandler.connect(addr1).removeCollateralMATIC(0)).to.be.revertedWith(
            "MATICVaultHandler::removeCollateralMATIC: value can't be 0"
        );
        await expect(maticTokenHandler.connect(addr1).removeCollateralMATIC(amount))
            .to.emit(maticTokenHandler, "CollateralRemoved")
            .withArgs(accounts[1], 1, amount);

        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(vaultBalance.sub(amount));
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        let currentBalance = await ethers.provider.getBalance(accounts[1]);
        expect(userBalance.add(amount)).to.gt(currentBalance);
        let balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(contractBalance.sub(amount));
        await maticTokenHandler.connect(addr1).removeCollateralMATIC(amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(vaultBalance.sub(amount).sub(amount));
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);

        currentBalance = await ethers.provider.getBalance(accounts[1]);
        expect(userBalance.add(amount).add(amount)).to.gt(currentBalance);
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(vaultBalance.sub(amount).sub(amount));
    });

    it("...should allow user to retrieve unused collateral on wmatic", async () => {
        const amount = ethers.utils.parseEther("375");
        const bigAmount = ethers.utils.parseEther("100375");
        let balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(0);

        await expect(maticTokenHandler.connect(addr3).removeCollateral(amount)).to.be.revertedWith(
            "VaultHandler::vaultExists: no vault created"
        );
        await expect(maticTokenHandler.connect(addr1).removeCollateral(bigAmount)).to.be.revertedWith(
            "VaultHandler::removeCollateral: retrieve amount higher than collateral"
        );
        await expect(maticTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
            "VaultHandler::notZero: value can't be 0"
        );
        await expect(maticTokenHandler.connect(addr1).removeCollateral(amount))
            .to.emit(maticTokenHandler, "CollateralRemoved")
            .withArgs(accounts[1], 1, amount);

        let vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(amount);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(amount);
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(amount);
        await maticTokenHandler.connect(addr1).removeCollateral(amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(0);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
        balance = await wmaticTokenInstance.balanceOf(accounts[1]);
        expect(balance).to.eq(amount.add(amount));
        balance = await wmaticTokenInstance.balanceOf(maticTokenHandler.address);
        expect(balance).to.eq(0);
    });

    it("...should return the correct minimal collateral required", async () => {
        let amount = ethers.utils.parseEther("1");
        const reqAmount = await maticTokenHandler.requiredCollateral(amount);
        const ethPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
        const tcapPrice = await maticTokenHandler.TCAPPrice();
        const ratio = await maticTokenHandler.ratio();
        let result = tcapPrice.mul(amount).mul(ratio).div(100).div(ethPrice);
        expect(reqAmount).to.eq(result);
    });

    it("...should allow user to mint tokens", async () => {
        const amount = ethers.utils.parseEther("10");
        const amount2 = ethers.utils.parseEther("11");
        const lowAmount = ethers.utils.parseEther("1");
        const bigAmount = ethers.utils.parseEther("100");
        const reqAmount2 = await maticTokenHandler.requiredCollateral(amount2);
        const mintFee = await maticTokenHandler.getMintFee(bigAmount);

        await wmaticTokenInstance.connect(addr1).deposit({ value: reqAmount2 });
        let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
        expect(tcapBalance).to.eq(0);
        await wmaticTokenInstance.connect(addr1).approve(maticTokenHandler.address, reqAmount2);
        await maticTokenHandler.connect(addr1).addCollateral(reqAmount2);
        await expect(maticTokenHandler.connect(addr3).mint(amount)).to.be.revertedWith(
            "VaultHandler::vaultExists: no vault created"
        );
        await expect(maticTokenHandler.connect(addr1).mint(bigAmount, { value: mintFee })).to.be.revertedWith(
            "VaultHandler::mint: not enough collateral"
        );
        await expect(maticTokenHandler.connect(addr1).mint(amount, { value: mintFee }))
            .to.emit(maticTokenHandler, "TokensMinted")
            .withArgs(accounts[1], 1, amount);
        tcapBalance = await tcapInstance.balanceOf(accounts[1]);
        expect(tcapBalance).to.eq(amount);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(reqAmount2);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(amount);
        await expect(maticTokenHandler.connect(addr1).mint(lowAmount, { value: mintFee })).to.be.revertedWith(
            "VaultHandler::mint: collateral below min required ratio"
        );
    });

    it("...should allow users to get collateral ratio", async () => {
        let ratio = await maticTokenHandler.getVaultRatio(2);
        expect(ratio).to.eq(0);
        ratio = await maticTokenHandler.getVaultRatio(1);
        expect(ratio).to.eq(164);
    });

    it("...shouln't allow users to retrieve stake unless debt is paid", async () => {
        let vault = await maticTokenHandler.getVault(1);
        await expect(maticTokenHandler.connect(addr1).removeCollateral(vault[1])).to.be.revertedWith(
            "VaultHandler::removeCollateral: collateral below min required ratio"
        );
    });

    it("...should calculate the burn fee", async () => {
        let amount = ethers.utils.parseEther("10");
        let divisor = 10000;
        let tcapPrice = await maticTokenHandler.TCAPPrice();
        let ethPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
        let result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
        let fee = await maticTokenHandler.getBurnFee(amount);
        expect(fee).to.eq(result);
        amount = ethers.utils.parseEther("100");
        result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
        fee = await maticTokenHandler.getBurnFee(amount);
        expect(fee).to.eq(result);
    });

    it("...should allow users to burn tokens", async () => {
        const amount = ethers.utils.parseEther("10");
        const amount2 = ethers.utils.parseEther("11");
        const bigAmount = ethers.utils.parseEther("100");
        const ethHighAmount = ethers.utils.parseEther("50");
        const reqAmount2 = await maticTokenHandler.requiredCollateral(amount2);
        const ethAmount = await maticTokenHandler.getBurnFee(amount);
        const ethAmount2 = await maticTokenHandler.getBurnFee(bigAmount);


        await expect(maticTokenHandler.connect(addr3).burn(amount)).to.be.revertedWith(
            "VaultHandler::vaultExists: no vault created"
        );
        await expect(maticTokenHandler.connect(addr1).burn(amount)).to.be.revertedWith(
            "VaultHandler::burn: burn fee less than required"
        );
        await expect(
            maticTokenHandler.connect(addr1).burn(bigAmount, { value: ethAmount2 })
        ).to.be.revertedWith("VaultHandler::burn: amount greater than debt");

        await expect(maticTokenHandler.connect(addr1).burn(amount, { value: ethAmount }))
            .to.emit(maticTokenHandler, "TokensBurned")
            .withArgs(accounts[1], 1, amount);
        let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
        expect(tcapBalance).to.eq(0);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(reqAmount2);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
    });

    it("...should update the collateral ratio", async () => {
        let ratio = await maticTokenHandler.getVaultRatio(1);
        expect(ratio).to.eq(0);
    });

    it("...should allow users to retrieve stake when debt is paid", async () => {
        let vault = await maticTokenHandler.getVault(1);
        await expect(maticTokenHandler.connect(addr1).removeCollateral(vault[1]))
            .to.emit(maticTokenHandler, "CollateralRemoved")
            .withArgs(accounts[1], 1, vault[1]);
        vault = await maticTokenHandler.getVault(1);
        expect(vault[0]).to.eq(1);
        expect(vault[1]).to.eq(0);
        expect(vault[2]).to.eq(accounts[1]);
        expect(vault[3]).to.eq(0);
    });

    it("...should test liquidation requirements", async () => {
        //Prepare for liquidation tests
        let amount = ethers.utils.parseEther("10");
        const mintFee = await maticTokenHandler.getMintFee(amount);
        const reqAmount = await maticTokenHandler.requiredCollateral(ethers.utils.parseEther("11"));

        //liquidated
        await maticTokenHandler.connect(lq).createVault();
        await wmaticTokenInstance.connect(lq).deposit({ value: reqAmount });
        await wmaticTokenInstance.connect(lq).approve(maticTokenHandler.address, reqAmount);
        await maticTokenHandler.connect(lq).addCollateral(reqAmount);
        await maticTokenHandler.connect(lq).mint(amount, { value: mintFee });
        await expect(maticTokenHandler.connect(addr3).liquidateVault(99, 0)).to.be.revertedWith(
            "VaultHandler::liquidateVault: no vault created"
        );
        await expect(maticTokenHandler.connect(addr3).liquidateVault(2, 0)).to.be.revertedWith(
            "VaultHandler::liquidateVault: vault is not liquidable"
        );
        const totalMarketCap = "43129732288636297500";
        await aggregatorTCAPInstance.connect(owner).setLatestAnswer(totalMarketCap);
    });

    it("...should get the required collateral for liquidation", async () => {
        let reqLiquidation = await maticTokenHandler.requiredLiquidationTCAP(2);
        let liquidationPenalty = await maticTokenHandler.liquidationPenalty();
        let ratio = await maticTokenHandler.ratio();
        let collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
        let tcapPrice = await maticTokenHandler.TCAPPrice();
        let vault = await maticTokenHandler.getVault(2);
        let collateralTcap = vault[1].mul(collateralPrice).div(tcapPrice);
        let reqDividend = vault[3].mul(ratio).div(100).sub(collateralTcap).mul(100);
        let reqDivisor = ratio.sub(liquidationPenalty.add(100));
        let result = reqDividend.div(reqDivisor);
        expect(result).to.eq(reqLiquidation);
    });

    it("...should get the liquidation reward", async () => {
        let reqLiquidation = await maticTokenHandler.requiredLiquidationTCAP(2);
        let liquidationReward = await maticTokenHandler.liquidationReward(2);
        let liquidationPenalty = await maticTokenHandler.liquidationPenalty();
        let collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
        let tcapPrice = await maticTokenHandler.TCAPPrice();

        let result = reqLiquidation.mul(liquidationPenalty.add(100)).div(100);
        result = result.mul(tcapPrice).div(collateralPrice);
        expect(result).to.eq(liquidationReward);
    });

    it("...should allow liquidators to return profits", async () => {
        const divisor = ethers.utils.parseEther("1");
        const liquidationReward = await maticTokenHandler.liquidationReward(2);
        const reqLiquidation = await maticTokenHandler.requiredLiquidationTCAP(2);
        const tcapPrice = await maticTokenHandler.TCAPPrice();
        const collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
        const rewardUSD = liquidationReward.mul(collateralPrice).div(divisor);
        const collateralUSD = reqLiquidation.mul(tcapPrice).div(divisor);
        expect(rewardUSD).to.be.gte(
            collateralUSD,
            "reward should be greater than collateral paid to liquidate"
        );
    });
    it("...should allow users to liquidate users on vault ratio less than ratio", async () => {
        const treasuryAddress = treasury;
        const beforeTreasury = await ethers.provider.getBalance(treasuryAddress);
        let vaultRatio = await maticTokenHandler.getVaultRatio(2);

        //liquidator setup
        let liquidatorAmount = ethers.utils.parseEther("20");
        let mintFee = await maticTokenHandler.getMintFee(liquidatorAmount);
        const reqLiquidatorAmount = await maticTokenHandler.requiredCollateral(
            ethers.utils.parseEther("110")
        );
        await maticTokenHandler.connect(addr3).createVault();
        await wmaticTokenInstance.connect(addr3).deposit({ value: reqLiquidatorAmount });
        await wmaticTokenInstance
            .connect(addr3)
            .approve(maticTokenHandler.address, reqLiquidatorAmount);
        await maticTokenHandler.connect(addr3).addCollateral(reqLiquidatorAmount);
        await maticTokenHandler.connect(addr3).mint(liquidatorAmount, { value: mintFee });

        let liquidationReward = await maticTokenHandler.liquidationReward(2);
        let reqLiquidation = await maticTokenHandler.requiredLiquidationTCAP(2);
        let tcapBalance = await tcapInstance.balanceOf(accounts[3]);
        let collateralBalance = await wmaticTokenInstance.balanceOf(accounts[3]);
        let vault = await maticTokenHandler.getVault(2);
        const burnAmount = await maticTokenHandler.getBurnFee(reqLiquidation);
        const fakeBurn = await maticTokenHandler.getBurnFee(1);
        await expect(
            maticTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation)
        ).to.be.revertedWith("VaultHandler::liquidateVault: burn fee less than required");
        await expect(
            maticTokenHandler.connect(addr3).liquidateVault(2, 1, { value: fakeBurn })
        ).to.be.revertedWith(
            "VaultHandler::liquidateVault: liquidation amount different than required"
        );
        await expect(
            maticTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation, { value: burnAmount })
        )
            .to.emit(maticTokenHandler, "VaultLiquidated")
            .withArgs(2, accounts[3], reqLiquidation, liquidationReward);

        vaultRatio = await maticTokenHandler.getVaultRatio(2);
        let newTcapBalance = await tcapInstance.balanceOf(accounts[3]);
        let newCollateralBalance = await wmaticTokenInstance.balanceOf(accounts[3]);
        let updatedVault = await maticTokenHandler.getVault(2);
        let currentEthBalance = await ethers.provider.getBalance(maticTokenHandler.address);
        expect(currentEthBalance).to.eq(0);
        expect(updatedVault[1]).to.eq(vault[1].sub(liquidationReward));
        expect(updatedVault[3]).to.eq(vault[3].sub(reqLiquidation));
        expect(newCollateralBalance).to.eq(collateralBalance.add(liquidationReward));
        expect(tcapBalance).to.eq(newTcapBalance.add(reqLiquidation)); //increase earnings
        expect(vaultRatio).to.be.gte(parseInt(ratio)); // set vault back to ratio
        const afterTreasury = await ethers.provider.getBalance(treasuryAddress);
        expect(afterTreasury.gt(beforeTreasury)).eq(true);
    });

    it("...should allow owner to pause contract", async () => {
        await expect(maticTokenHandler.connect(addr1).pause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        await expect(orchestratorInstance.connect(guardian).pauseVault(maticTokenHandler.address))
            .to.emit(maticTokenHandler, "Paused")
            .withArgs(orchestratorInstance.address);
        let paused = await maticTokenHandler.paused();
        expect(paused).to.eq(true);
    });

    it("...shouldn't allow contract calls if contract is paused", async () => {
        await expect(maticTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
            "Pausable: paused"
        );
        await expect(maticTokenHandler.connect(addr1).addCollateral(0)).to.be.revertedWith(
            "Pausable: paused"
        );
        await expect(maticTokenHandler.connect(addr1).mint(0, { value: 1 })).to.be.revertedWith("Pausable: paused");
        await expect(maticTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
            "Pausable: paused"
        );
    });

    it("...should allow owner to unpause contract", async () => {
        await expect(maticTokenHandler.connect(addr1).unpause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        await expect(orchestratorInstance.connect(guardian).unpauseVault(maticTokenHandler.address))
            .to.emit(maticTokenHandler, "Unpaused")
            .withArgs(orchestratorInstance.address);
        let paused = await maticTokenHandler.paused();
        expect(paused).to.eq(false);
    });
});
