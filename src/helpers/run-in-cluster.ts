import * as cluster from 'cluster';
import * as os from 'os';

export const runInCluster = (bootstrap: () => Promise<void>) => {
  const clusterLib: any = cluster;
  const numberOfCores = os.cpus().length;

  if (clusterLib.isPrimary) {
    for (let i = 0; i < numberOfCores; i++) {
      clusterLib.fork();
    }
  } else {
    bootstrap();
  }
};
