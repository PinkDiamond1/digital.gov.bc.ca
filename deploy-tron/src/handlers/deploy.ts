import { Context } from 'probot';
import { extractDeployCommandValues } from '../utils/stringutils';
import { getRepoAndOwnerFromContext, getHeadRefFromPr, createComment } from '../utils/ghutils';
import { createDeployment, isTherePendingDeploymentForEnvironment, getLatestEnvironmentStatusesForRef, isEnvironmentAllowedToDeploy } from '../utils/deployment';
import { DEFAULT_SYNONYMS, ENVIRONMENTS } from '../constants';
import { MESSAGES } from '../constants/messages';
import config from '../config/index.json';

interface synonyms {
  [key: string]: string;
}

export const deploy = async (context: Context): Promise<void> => {
  const commentBody = context.payload.comment.body;
  const commentOwner = context.payload.comment.user.login;
  const deployValues = extractDeployCommandValues(commentBody);
  if (deployValues !== null) {
    

    const deploymentEnvSynonyms: synonyms = {
      ...DEFAULT_SYNONYMS,
      ...ENVIRONMENTS,
      ...config.environmentSynonyms,
    };

    const environment: string = deploymentEnvSynonyms[deployValues.environment];

    const { repo, owner } = getRepoAndOwnerFromContext(context);
    // check for pending deployments in that environment for another ref
    // get head ref from pr
    const ref = await getHeadRefFromPr(context);

    // @ts-ignore
    const allowsMultipleDeploysToEnv = config.environmentsThatAllowConcurrentDeploys.findIndex(env => env === environment) > -1;

    const pendingDeploymentsExist = await isTherePendingDeploymentForEnvironment(context, ref, environment, repo, owner);
    if(!pendingDeploymentsExist || allowsMultipleDeploysToEnv) {
      const deploymentStatuses = await getLatestEnvironmentStatusesForRef(context, ref, repo, owner);
      // @ts-ignore
      const requiredEnvironments = config.requiredEnvironments[environment]
      const canDeploy = isEnvironmentAllowedToDeploy(requiredEnvironments, deploymentStatuses);

      if(canDeploy) {
        // check if previous deployments in train have completed
        await createDeployment(
          context,
          repo,
          owner,
          environment,
          deployValues.microservice,
          ref,
          // @ts-ignore
          config.requiredContexts[environment] || [],
        );

        await createComment(context, 'Deployment successfully created!');
      } else {
        const body = `
          Unable to create a deployment :(
          Deploying to ${environment} requires **${requiredEnvironments.join()}** to be deployed for this ref before you can deploy to **${environment}**.
        `
        await createComment(context, body);
      }
    } else {
      await createComment(context, 'There is already a pending deployment to this environment, unable to deploy until that one completes');
    }
    
  } else {
    context.log(MESSAGES.badDeployCommand(commentOwner, commentBody));
  }
};
