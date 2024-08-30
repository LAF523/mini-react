// 最小堆算法的相关操作

/**
 * @message: 向数组中添加一个任务对象
 * @param {*} heap 最小堆数组,最小堆的层序遍历
 * @param {{sortIndex:任务优先级,id:任务创建时间}} node 任务对象
 */
export function push(heap, node) {
  const len = heap.length;
  heap.push(node);
  siftUp(heap, node, len - 1); // 节点上浮
}
/**
 * 获取最小值
 */
export function peek(heap) {
  return heap.length > 0 ? heap[0] : null;
}
/**
 * 获取最小值,并从最小堆中删除该值
 */
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  let firstNode = heap[0];
  let lastNode = heap.pop();
  if (firstNode !== lastNode) {
    heap[0] = lastNode;
    siftDown(heap, lastNode, 0);
  }
  return firstNode;
}

// 节点上浮,新增节点时,向上比较,父节点较大时,交换两节点位置
function siftUp(heap, node, nodeIndex) {
  const parentIndex = (nodeIndex - 1) >>> 1;
  const parent = heap[parentIndex];
  while (nodeIndex > 0) {
    if (isLeftLeveHigher(node, parent)) {
      heap[parentIndex] = node;
      heap[nodeIndex] = parent;
      nodeIndex = parentIndex;
    } else {
      return;
    }
  }
}
// 节点下沉,删除根节点时,将最后一个节点放在根元素位置,然后下沉构建最小堆数组
function siftDown(heap, node, index) {
  const len = heap.length;
  const helfLen = len >>> 1;
  while (index < helfLen) {
    const leftChildIndex = index * 2 + 1;
    const left = heap[leftChildIndex];
    const rightChildIndex = leftChildIndex + 1;
    const right = heap[rightChildIndex];

    const leveHigherIndex =
      rightChildIndex < len && isLeftLeveHigher(right, left)
        ? rightChildIndex
        : leftChildIndex;
    const leveHigherNode = heap[leveHigherIndex];

    if (!isLeftLeveHigher(node, leveHigherNode)) {
      heap[index] = leveHigherNode;
      heap[leveHigherIndex] = node;
      index = leveHigherIndex;
    } else {
      return;
    }
  }
}

// 左边node优先级是否比右边的高
function isLeftLeveHigher(node1, node2) {
  let diff = node1.sorIndex - node2.sortIndex;
  if (diff === 0) {
    diff = node1.id - node2.id;
  }
  if (diff < 0) {
    return true;
  }
  if (diff > 0) {
    return false;
  }
}
