/**
 * 兼容处理: 从事件对象中获取目标DOM
 */
export function getEventTarget(event) {
  const target = event.target || event.srcElement || window;
  return target;
}
