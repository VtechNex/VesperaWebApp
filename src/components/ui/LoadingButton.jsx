import React from "react";
import { Button } from "./button";

export default function LoadingButton({ loading, children, disabled, ...props }) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? "Saving..." : children}
    </Button>
  );
}
