"use client";

import { Avatar } from "@radix-ui/react-avatar";
import React from "react";

const Assistant: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 print:hidden">
      <Avatar>Assistant</Avatar>
    </div>
  );
};

export default Assistant;
