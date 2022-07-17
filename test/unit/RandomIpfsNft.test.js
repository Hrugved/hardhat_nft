const { assert, expect } = require("chai")
const { network, ethers, deployments } = require("hardhat")
const { devChains, networkConfig } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
  ? describe.skip
  : describe("Random IPFS NFT unit tests", async () => {
      let deployer, randomIpfsNft, vrfCoordinatorV2Mock
      const chainId = network.config.chainId
      const mintFee = networkConfig[chainId]["mintFee"]
      beforeEach(async () => {
        deployer = (await ethers.getSigners())[0]
        await deployments.fixture(["mocks", "randomipfs"])
        randomIpfsNft = await ethers.getContract("RandomIpfsNft")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
      })
      describe("constructor", () => {
        it("sets initial values correctly", async () => {
          expect(await randomIpfsNft.getMintFee()).to.equal(mintFee)
          expect(await randomIpfsNft.getDogTokenURIs(0)).to.have.string("ipfs://")
          expect(await randomIpfsNft.getInitialized()).to.be.true
        })
      })
      describe("requestNft", () => {
        it("fails for not enough payment", async () => {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
            "RandomIpfsNft__NeedMoreETHSent"
          )
        })
        it("emits event on success", async () => {
          await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
            randomIpfsNft,
            "NFTRequested"
          )
        })
      })
      describe("fulfillRandomWords", async () => {
        it("can mint NFT when received random number", async () => {
          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once("NFTMinted", async () => {
              try {
                expect(await randomIpfsNft.getTokenCounter()).to.equal(1)
                expect(await randomIpfsNft.tokenURI(0)).to.have.string("ipfs://")
                resolve()
              } catch (e) {
                console.log(e)
                reject(e)
              }
            })
            try {
              const txResponse = await randomIpfsNft.requestNft({ value: mintFee })
              const txReceipt = await txResponse.wait(1)
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                randomIpfsNft.address
              )
            } catch (e) {
              console.log(e)
              reject(e)
            }
          })
        })
      })
    })
