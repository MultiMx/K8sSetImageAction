import * as k8s from "@kubernetes/client-node";

export const bodyPatchAppsImage = (
  container: number,
  image: string,
): string => {
  return JSON.stringify([
    {
      op: "replace",
      path: `/spec/template/spec/containers/${container}/image`,
      value: image,
    },
  ]);
};

export const bodyPatchJobImage = (
  container: number,
  image: string,
): string => {
  return JSON.stringify([
    {
      op: "replace",
      path: `/spec/jobTemplate/spec/template/spec/containers/${container}/image`,
      value: image,
    },
  ]);
};

export interface WorkloadStrategy {
  patch: (body: string) => Promise<any>;
  getPatchImageBody: (container: number, image: string) => string;
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
      patch: async (body: string) =>
        appsApi.patchNamespacedStatefulSet({
          namespace,
          name,
          body,
        }),
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
      patch: async (body: string) =>
        appsApi.patchNamespacedDaemonSet({
          namespace,
          name,
          body,
        }),
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
      patch: async (body: string) =>
        batchApi.patchNamespacedCronJob({
          namespace,
          name,
          body,
        }),
      getPatchImageBody: bodyPatchJobImage,
      isAvailable: () => {
        throw new Error("Waiting for CronJob not supported");
      },
    },
  };

  return strategies[controller.toLowerCase()];
};
