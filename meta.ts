export interface VendorSkillMeta {
  official?: boolean;

  source: string;

  skills: Record<string, string>; // sourceSkillName -> outputSkillName
}

/**
 * Repositories to clone as submodules and generate skills from source
 */
export const submodules = {
  pnpm: "https://github.com/pnpm/pnpm.io",
  astro: "https://github.com/withastro/docs",
};

/**
 * Already generated skills, sync with their `skills/` directory
 */
export const vendors: Record<string, VendorSkillMeta> = {};

/**
 * Hand-written skills
 */
export const manual: string[] = [];
