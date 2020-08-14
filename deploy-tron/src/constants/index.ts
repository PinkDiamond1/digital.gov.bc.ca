export const COMMANDS = {
  help: 'help',
  deploy: 'deploy',
  knockknock: 'knockknock',
};

export const ENVIRONMENTS = {
  uat: 'uat',
  production: 'production',
  development: 'development',
};

export const DEFAULT_SYNONYMS = {
  test: ENVIRONMENTS.uat,
  prod: ENVIRONMENTS.production,
  dev: ENVIRONMENTS.development,
};
