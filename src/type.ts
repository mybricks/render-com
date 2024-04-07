export interface Scene {
  id: string;
  inputs: Array<{
    id: string;
    type: "normal" | "config";
    extValues: {
      config: {
        type: string;
        description: string;
        defaultValue: unknown;
      };
    };
    title: string;
    schema: unknown;
  }>;
  outputs: Array<{
    id: string;
    title: string;
    schema: unknown;
  }>;
  pinRels: { [key: string]: string[] };
  deps: Array<{ namespace: string; version: string; rtType?: string }>;
}

export type ToJSON = Scene & {
  scenes?: Scene[];
  modules?: Record<
    string,
    {
      title: string;
      json: Scene;
    }
  >;
  plugins: {
    "@mybricks/plugins/service": unknown[];
  };
};

export interface ComJSON {
  author: string;
  author_name: string;
  title: string;
  namespace: string;
}
