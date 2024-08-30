import { useState } from "react";
import { createRoot } from "react-dom/client";

function MyFunctionComponent() {
  const [number, setAge] = useState(0);
  return (
    <button
      onClick={() => {
        setAge(number + 1);
        setAge(number + 1);
        setAge(number + 1);
        // setAge((state) => state + 1);
      }}
    >
      +Age:
      {number}
    </button>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
