import { REACT_ELEMENT_TYPE } from "shared/ReactSymbol";

// config中不需要添加到props中的属性
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};
export function jsxDEV(type, config, maybekey) {
  let props = getProps(config);
  let key = getKey(config, maybekey);
  let ref = getRef(config);

  return createElement(type, props, ref, key);
}

// 创建虚拟DOM
function createElement(type, props, ref, key) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    props,
    ref,
    key,
  };
}

function getProps(config) {
  let props = {};

  for (let propsName in config) {
    if (
      config.hasOwnProperty(propsName) &&
      !RESERVED_PROPS.hasOwnProperty(propsName)
    ) {
      props[propsName] = config[propsName];
    }
  }
  return props;
}
function getKey(config, maybekey) {
  let key = null;
  if (maybekey) {
    key = maybekey;
  }
  if (hasValidKey(config)) {
    key = String(config.key);
  }
  return key;
}
function getRef(config) {
  let ref = null;
  if (hasValidRef(config)) {
    ref = config.ref;
  }
  return ref;
}

function hasValidKey(config) {
  return config.key !== undefined;
}
function hasValidRef(config) {
  return config.ref !== undefined;
}
