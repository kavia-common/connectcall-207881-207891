import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders ConnectCall brand", () => {
  render(<App />);
  const brand = screen.getByText(/ConnectCall/i);
  expect(brand).toBeInTheDocument();
});
