// const { ethers } = require("hardhat")

const networkConfig = {
  4: {
    name:'rinkeby'
  },
  31337: {
    name: 'hardhat'
  }
}

const devChains = ['hardhat','localhost']

module.exports = {
  networkConfig,
  devChains
}