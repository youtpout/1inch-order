import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PositionOrderModule", (m) => {
    const inchAddress = "0x111111125421ca6dc452d289314280a0f8842a65";
    const counter = m.contract("PositionOrder", [inchAddress]);

    return { counter };
});
