/// <reference types="vite/client" />

declare module '*.i18n.yml?raw' {
  const content: string;
  export default content;
}
