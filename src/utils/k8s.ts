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
  patch: (body: any) => Promise<any>;
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
      patch: async (body: any) =>
        appsApi.patchNamespacedDeployment(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", k8s.PatchStrategy.MergePatch),
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
      patch: async (body: any) =>
        appsApi.patchNamespacedStatefulSet(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", k8s.PatchStrategy.MergePatch),
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
      patch: async (body: any) =>
        appsApi.patchNamespacedDaemonSet(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", k8s.PatchStrategy.MergePatch),
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
      patch: async (body: any) =>
        batchApi.patchNamespacedCronJob(
          {
            namespace,
            name,
            body,
          },
          k8s.setHeaderOptions("Content-Type", k8s.PatchStrategy.MergePatch),
        ),
      getPatchImageBody: bodyPatchJobImage,
      isAvailable: () => {
        throw new Error("Waiting for CronJob not supported");
      },
    },
  };

  return strategies[controller.toLowerCase()];
};
