import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off"
    }
  }
];
