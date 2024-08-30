// export const NoFlags = 0; // 无操作
// export const Placement = 2; //插入操作
// export const Update = 4; //更新操作
// export const ChildDeletion = 8; // 删除子节点
// export const Passive = 16;
// export const MutationMask = Placement | Update;

export const NoFlags = 0b00000000000000000000000000; // 标识位：无
export const Placement = 0b00000000000000000000000010; // 标识位：插入
export const Update = 0b00000000000000000000000100; // 标识位：更新
export const ChildDeletion = 0b00000000000000000000001000; // 标识位：删除
export const MutationMask = Placement | Update; // 变更标识位掩码
export const Passive = 0b00000000000000000000010000;
export const LayoutMask = Update;
