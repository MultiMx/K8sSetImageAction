import * as k8s from "@kubernetes/client-node";

const shouldBypassProxy = (hostname: string, noProxy: string): boolean => {
  const entries = noProxy.split(",").map((e) => e.trim()).filter(Boolean);
  for (const entry of entries) {
    if (entry === "*") return true;
    // Exact match or suffix match (e.g. .example.com matches foo.example.com)
    if (hostname === entry) return true;
    if (hostname.endsWith(`.${entry}`)) return true;
    // Entry with leading dot
    if (entry.startsWith(".") && hostname.endsWith(entry)) return true;
  }
  return false;
};

export const getProxyUrl = (targetUrl: string): string | undefined => {
  const parsed = new URL(targetUrl);
  const isHttps = parsed.protocol === "https:";

  const proxyUrl = isHttps
    ? process.env.https_proxy || process.env.HTTPS_PROXY
    : process.env.http_proxy || process.env.HTTP_PROXY;

  if (!proxyUrl) return undefined;

  const noProxy = process.env.no_proxy || process.env.NO_PROXY;
  if (noProxy && shouldBypassProxy(parsed.hostname, noProxy)) {
    return undefined;
  }

  return proxyUrl;
};

export const configureProxyForKubeConfig = (kc: k8s.KubeConfig): void => {
  const cluster = kc.getCurrentCluster();
  if (!cluster) return;

  const proxyUrl = getProxyUrl(cluster.server);
  if (proxyUrl) {
    (cluster as { proxyUrl?: string }).proxyUrl = proxyUrl;
  }
};

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
