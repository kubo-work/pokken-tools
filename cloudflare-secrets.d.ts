// `.dev.vars`（ローカル）/ Workers Secrets（本番）で供給される値の型。
// `wrangler types` が生成する cloudflare-env.d.ts は wrangler.toml のバインディングしか
// 拾わず .dev.vars を見ないため、ここで CloudflareEnv に手動でマージする。
interface CloudflareEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
}
