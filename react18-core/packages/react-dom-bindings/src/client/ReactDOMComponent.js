import {
  setValForStyles,
  setTextContent,
  setValueForProperty,
} from "./DOMPropertyOperations";
import { setValueForStyles } from "./CSSProper";

export function setInitialProperties(dom, type, props) {
  Object.keys(props).forEach((key) => {
    const newVal = props[key];
    if (key === "sytle") {
      setValForStyles(dom, newVal);
      return;
    }

    if (key === "children") {
      if (["string", "number"].includes(typeof newVal)) {
        setTextContent(dom, String(newVal));
      }
      return;
    }

    if (newVal !== null) {
      setValueForProperty(dom, key, newVal);
    }
  });
}

export function diffProperties(domElement, tag, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  let styleName;
  let styleUpdates = null;
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] === null
    ) {
      continue;
    }
    if (propKey === "style") {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = "";
        }
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined;
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp === null && lastProp === null)
    ) {
      continue;
    }
    if (propKey === "style") {
      if (lastProp) {
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) styleUpdates = {};
            styleUpdates[styleName] = "";
          }
        }
        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) styleUpdates = {};
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        styleUpdates = nextProp;
      }
    } else if (propKey === "children") {
      const children = Array.isArray(nextProps[propKey])
        ? nextProps[propKey]
        : [nextProps[propKey]];
      let textChild;
      textChild = children.reduce((acc, curr) => {
        if (typeof curr === "string" || typeof curr === "number") {
          acc += curr;
        }
        return acc;
      }, "");
      if (textChild) {
        (updatePayload = updatePayload || []).push(propKey, textChild);
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }
  if (styleUpdates) {
    (updatePayload = updatePayload || []).push("style", styleUpdates);
  }
  return updatePayload;
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === "style") {
      setValueForStyles(domElement, propValue);
    } else if (propKey === "children") {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}
