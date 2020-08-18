import { Context } from 'probot';
import { MESSAGES } from '../constants/messages';
import { ENVIRONMENTS } from '../constants';
import config from '../config/index.json';


export const createDeployment = (
  context: Context,
  repo: string,
  owner: string,
  environment: string,
  microservice: string,
  ref: string,
  requiredContexts = [],
) => {

  const user = context.payload.issue.user.login;
  context.log(MESSAGES.deploying(user, microservice, environment, ref));

  return context.github.repos.createDeployment({
    repo,
    owner,
    ref, 
    environment,
    description: 'deploy request from ci-cd',
    payload: JSON.stringify({
      microservice,
      pr: context.payload.issue.number,
      user ,
    }),
    required_contexts: requiredContexts,
    transient_environment: environment !== ENVIRONMENTS.production,
    headers: {
      'Accept': 'application/vnd.github.ant-man-preview+json',
    }
  })
};


interface latestStatus {
  node: {
    latestStatus: string
  }
}

/**
 * checks to see if there are already pending deployments to this enviornment that are not the current ref
 * for shared enviornments like prod or test, you do not want to trigger a deployment workflow if one is already
 * in place
 * @param context 
 * @param ref 
 * @param env 
 * @param repo 
 * @param owner 
 */
export const isTherePendingDeploymentForEnvironment = async (context: Context, ref: string, env: string, repo: string, owner: string): Promise<boolean> => {

  const data = await context.github.graphql(`
  query latestStatus($owner: String!, $repo: String!, $env: String!, $maxLookup: Int = 10) 
  {
    repository(name:$repo, owner:$owner) {
      deployments(orderBy: {field: CREATED_AT, direction: DESC}, first:$maxLookup, environments:[$env]) {
        edges {
          node {
            latestStatus {
              state
            }
            ref {
              name
            }
          }
        }
      }
    }
  }  
  `,
  {
    repo,
    owner,
    maxLookup: config.maxDeploymentsToLookupForPending,
    env
  });

  // @ts-ignore
  const index = data.repository.deployments.edges.findIndex((edge: latestStatus) => (edge.node.latestStatus === 'PENDING' && edge.node.ref.name !== ref));
  
  return index !== -1;
}


interface deployment {
  id: any;
  environment: string;
}

interface deploymentGroup {
  [key: string]: any;
}

export const getLatestEnvironmentStatusesForRef = async (context: Context, ref: string, repo: string, owner:string): Promise<object> => {
  const response = await context.github.repos.listDeployments({
    repo,
    owner,
    ref
  });

  // group deployments by environment and get latest status
  const groupedDeployments = response.data.reduce((groupedDeployments: deploymentGroup, deployment: deployment) => {
    const { environment } = deployment;
    if(!groupedDeployments[environment]) {
      groupedDeployments[environment] = deployment;
    }
    return groupedDeployments;
  }, {});
  // latest status is always the first one, get it for each env
  const latestStatuses = Object.keys(groupedDeployments).map(async (env: string) => {
    return {env, status: await context.github.repos.listDeploymentStatuses({repo, owner, deployment_id: groupedDeployments[env].id, per_page: 1})};
  }, {});

  const resolvedStatuses = await Promise.all(latestStatuses);
  // organize statuses against grouped environments
  return  resolvedStatuses.reduce((groupedStatuses: deploymentGroup, state) => {
    groupedStatuses[state.env] = state.status.data[0];
    return groupedStatuses
  }, {});
}

/**
 * some environments require that previous environments in the train deployed succesffuly
 * for example you wouldn't want to deploy to prod unless the ref had been deployed to dev and test
 * @param requiredEnvironments 
 * @param deploymentStatuses 
 * @returns {boolean}
 */
export const isEnvironmentAllowedToDeploy = (requiredEnvironments: string[], deploymentStatuses: deploymentGroup) => {
  if(!requiredEnvironments || requiredEnvironments.length === 0) return true;
  return requiredEnvironments.every((env:string) => deploymentStatuses[env].state === 'success' );
}