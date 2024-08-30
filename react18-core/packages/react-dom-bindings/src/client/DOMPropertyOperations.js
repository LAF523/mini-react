// 操作DOM元素属性方法

export function setValForStyles(dom, styles) {
  const { style } = dom;
  Object.entries(styles).forEach(([key, val]) => {
    style[key] = val;
  });
}

export function setTextContent(dom, text) {
  dom.textContent = text;
}

export function setValueForProperty(dom, key, val) {
  if (val === null) {
    dom.removeAttribute(key);
  } else {
    dom.setAttribute(key, val);
  }
}
