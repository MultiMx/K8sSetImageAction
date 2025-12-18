import * as k8s from "@kubernetes/client-node";

export const generatePatchAppsTemplate = (
  container: string,
  image: string,
): string => {
  return JSON.stringify({
    spec: {
      template: {
        spec: {
          containers: [{ name: container, image: image }],
        },
      },
    },
  });
};

export const generatePatchBatchTemplate = (
  container: string,
  image: string,
): string => {
  return JSON.stringify({
    spec: {
      jobTemplate: {
        spec: {
          template: {
            spec: {
              containers: [{ name: container, image: image }],
            },
          },
        },
      },
    },
  });
};

export interface WorkloadStrategy {
  patch: (body: string) => Promise<any>;
  patchImageTemplate: (container: string, image: string) => string;
  isAvailable: () => Promise<boolean>;
}

export const getStrategy = (
  kc: k8s.KubeConfig,
  controller: string,
  namespace: string,
  name: string,
): WorkloadStrategy | undefined => {
  const appsApi = kc.makeApiClient(k8s.AppsV1Api);
  const batchApi = kc.makeApiClient(k8s.BatchV1Api);

  const strategies: Record<string, WorkloadStrategy> = {
    deployment: {
      patch: async (body: string) =>
        appsApi.patchNamespacedDeployment({
          namespace,
          name,
          body,
        }),
      patchImageTemplate: generatePatchAppsTemplate,
      isAvailable: async () =>
        await appsApi
          .readNamespacedDeployment({
            namespace,
            name,
          })
          .then((b) => b.status?.availableReplicas === b.spec?.replicas),
    },
    statefulset: {
      patch: async (body: string) =>
        appsApi.patchNamespacedStatefulSet({
          namespace,
          name,
          body,
        }),
      patchImageTemplate: generatePatchAppsTemplate,
      isAvailable: async () =>
        await appsApi
          .readNamespacedStatefulSet({
            namespace,
            name,
          })
          .then((b) => b.status?.readyReplicas === b.spec?.replicas),
    },
    daemonset: {
      patch: async (body: string) =>
        appsApi.patchNamespacedDaemonSet({
          namespace,
          name,
          body,
        }),
      patchImageTemplate: generatePatchAppsTemplate,
      isAvailable: async () =>
        await appsApi
          .readNamespacedDaemonSet({
            namespace,
            name,
          })
          .then(
            (b) => b.status?.numberReady === b.status?.desiredNumberScheduled,
          ),
    },
    cronjob: {
      patch: async (body: string) =>
        batchApi.patchNamespacedCronJob({
          namespace,
          name,
          body,
        }),
      patchImageTemplate: generatePatchBatchTemplate,
      isAvailable: () => {
        throw new Error("Waiting for CronJob not supported");
      },
    },
  };

  return strategies[controller.toLowerCase()];
};
