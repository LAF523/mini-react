// fiber节点的类型(tag)
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // 未知的fiber类型,源码中优先按照函数式组件处理,这里在使用的时候直接按照函数式组件处理
export const HostRoot = 3; //根节点,在浏览器中代表整个应用的根节点
export const HostComponent = 5; //常规节点,在浏览器中代表各种DOM元素,div,span
export const HostText = 6; // 文本节点
