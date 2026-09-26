// Type shim so `tsc` can check the functions in CI without Deno installed. Not deployed.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};
