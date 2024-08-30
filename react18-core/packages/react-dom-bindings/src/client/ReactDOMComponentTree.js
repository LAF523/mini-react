const randomKey = Math.random().toString(36).slice(2);
const internalPropsKey = `_ReactProps${randomKey}`;
const internalInstanceKey = `_ReactFiber${randomKey}`;
// fiber添加到dom
export function addFiberToDOM(fiber, dom) {
  dom[internalInstanceKey] = fiber;
}
// fiber的rpops添加到dom
export function addPropsToDOM(props, dom) {
  dom[internalPropsKey] = props;
}
export function getFiberFormDOM(target) {
  return target[internalInstanceKey];
}
export function getFiberPropsFormDOM(target) {
  return target[internalPropsKey];
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}
