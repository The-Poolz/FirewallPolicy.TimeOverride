import { HardhatUserConfig } from "hardhat/config"
import "@truffle/dashboard-hardhat-plugin"
import "@nomicfoundation/hardhat-toolbox"

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [
            {
                version: "0.8.19",
                settings: {
                    evmVersion: "istanbul",
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    viaIR: true,
                },
            },
        ],
    },
    networks: {
        hardhat: {
            blockGasLimit: 130_000_000,
        },
    },
}

export default config
