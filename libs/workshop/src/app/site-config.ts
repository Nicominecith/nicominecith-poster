declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ImportMetaEnv {
    readonly VITE_SITE_OWNER?: string;
    readonly VITE_SITE_ADDRESS?: string;
    readonly VITE_SITE_EMAIL?: string;
    readonly VITE_POSTER_BRAND?: string;
  }
}

export type SiteOperator = { name: string; address: string[]; email: string };

const setting = (value: string | undefined) => value?.trim() ?? "";

function operatorFrom(env: ImportMetaEnv): SiteOperator | null {
  const name = setting(env.VITE_SITE_OWNER);
  const address = setting(env.VITE_SITE_ADDRESS)
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean);
  const email = setting(env.VITE_SITE_EMAIL);
  return name && address.length > 0 && email ? { name, address, email } : null;
}

export const SITE = {
  owner: setting(import.meta.env.VITE_SITE_OWNER) || "Nicominecith_clips",
  operator: operatorFrom(import.meta.env),
  posterBrand: setting(import.meta.env.VITE_POSTER_BRAND) || "Nicominecith_clips",
};
