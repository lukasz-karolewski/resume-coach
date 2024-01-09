import React from "react";

const Footer: React.FC = () => {
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
  });
  return (
    <footer className="mx-auto p-4 text-center text-sm text-gray-500 print:hidden">
      &copy; {currentDate}
    </footer>
  );
};

export default Footer;
