import { useReducer } from "react";
import { createRoot } from "react-dom/client";
function getAge(state, action) {
  switch (action.type) {
    case "add":
      return state + action.value;
    default:
      return state;
  }
}
function MyFunctionComponent() {
  const [number, setAge] = useReducer(getAge, 0);
  return (
    <button
      onClick={() => {
        console.log("ppp");
        setAge({ type: "add", value: 1 });
      }}
    >
      +Age:
      {number}
    </button>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
