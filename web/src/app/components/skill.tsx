import React from "react";

interface SkillProps {
  children: string;
}

const Skill: React.FC<SkillProps> = ({ children }) => {
  return <span className="bg-gray-200 rounded px-1 py-0.5">{children}</span>;
};

export default Skill;
