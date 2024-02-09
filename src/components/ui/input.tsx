import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const id = useId();
    return (
      <input
        id={id}
        ref={ref}
        className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        role="presentation"
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
