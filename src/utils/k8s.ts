import * as k8s from "@kubernetes/client-node";

export const bodyPatchAppsImage = (container: string, image: string) => {
  return {
    spec: {
      template: {
        spec: {
          containers: [{ name: container, image: image }],
        },
      },
    },
  };
};

export const bodyPatchJobImage = (container: string, image: string) => {
  return {
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
  };
};

export interface WorkloadStrategy {
  patch: (contentType: string, body: any) => Promise<any>;
  getPatchImageBody: (container: string, image: string) => any;
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
      patch: async (contentType, body) =>
        appsApi.patchNamespacedDeployment(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", contentType),
        ),
      getPatchImageBody: bodyPatchAppsImage,
      isAvailable: async () =>
        await appsApi
          .readNamespacedDeployment({
            namespace,
            name,
          })
          .then((b) => b.status?.availableReplicas === b.spec?.replicas),
    },
    statefulset: {
      patch: async (contentType, body) =>
        appsApi.patchNamespacedStatefulSet(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", contentType),
        ),
      getPatchImageBody: bodyPatchAppsImage,
      isAvailable: async () =>
        await appsApi
          .readNamespacedStatefulSet({
            namespace,
            name,
          })
          .then((b) => b.status?.readyReplicas === b.spec?.replicas),
    },
    daemonset: {
      patch: async (contentType, body) =>
        appsApi.patchNamespacedDaemonSet(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", contentType),
        ),
      getPatchImageBody: bodyPatchAppsImage,
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
      patch: async (contentType, body) =>
        batchApi.patchNamespacedCronJob(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", contentType),
        ),
      getPatchImageBody: bodyPatchJobImage,
      isAvailable: () => {
        throw new Error("Waiting for CronJob not supported");
      },
    },
  };

  return strategies[controller.toLowerCase()];
};
