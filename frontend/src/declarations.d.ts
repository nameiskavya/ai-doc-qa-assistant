declare module "*.css";

interface ImportMeta {
  readonly env: {
    readonly VITE_API_BASE?: string;
    [key: string]: string | undefined;
  };
}