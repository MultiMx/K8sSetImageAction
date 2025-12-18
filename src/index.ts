import * as core from "@actions/core";
import * as k8s from "@kubernetes/client-node";

import ms, { StringValue } from "ms";

import { getStrategy } from "./utils/k8s";

async function main() {
  try {
    const server = core.getInput("server", { required: true });
    const skipTLSVerify = core.getInput("skipTLSVerify");
    const token = core.getInput("token", { required: true });

    const controller = core.getInput("controller").toLowerCase();
    const namespace = core.getInput("namespace", { required: true });
    const workload = core.getInput("workload", { required: true });

    const contentTypeInput = core.getInput("contentType");
    const bodyInput = core.getInput("body");

    const container = core.getInput("container");
    const image = core.getInput("image");

    const maxPatchRetry = parseInt(core.getInput("maxPatchRetry")) ?? 5;
    const wait = core.getInput("wait");
    const maxWaitDuration = core.getInput("maxWaitDuration");

    const maxWaitMs: number | undefined = ms(maxWaitDuration as StringValue);
    if (!maxWaitMs) {
      core.setFailed(`Invalid maxWaitDuration ${maxWaitDuration}`);
      return;
    }

    if (!bodyInput && (!container || !image)) {
      core.setFailed("Must provide container and image or body");
      return;
    }

    core.info(
      `Setting image for ${controller} workload: ${workload} container: ${container} in namespace: ${namespace}`,
    );

    const kc = new k8s.KubeConfig();
    kc.loadFromClusterAndUser(
      {
        name: "server",
        server: server,
        skipTLSVerify: skipTLSVerify === "true",
      },
      {
        name: "user",
        token: token,
      },
    );

    const strategy = getStrategy(kc, controller, namespace, workload);
    if (!strategy) {
      core.setFailed(`Unsupported controller ${controller}`);
      return;
    }

    try {
      const [contentType, body] = bodyInput
        ? [contentTypeInput, JSON.parse(bodyInput)]
        : [
            k8s.PatchStrategy.StrategicMergePatch,
            strategy.getPatchImageBody(container, image),
          ];
      if (!contentType) {
        core.setFailed("Must provide contentType while body is non-empty");
        return;
      }
      core.debug(
        `Content-Type: ${contentType}, Patch body: ${JSON.stringify(body)}`,
      );

      let count = 0;
      while (true) {
        try {
          await strategy.patch(contentType, body);
          break;
        } catch (err) {
          if (count < maxPatchRetry) {
            core.error(`Patch workload failed: ${err}, retrying...`);
            count++;
            core.debug(`count ${count}, maxPatchRetry ${maxPatchRetry}`);
          } else {
            core.setFailed(`Patch workload failed: ${err}`);
            return;
          }
        }

        core.debug("sleep 1s");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      core.setFailed(`Generate patch body failed: ${err}`);
      return;
    }

    core.info(`Image updated successfully`);

    if (wait === "true") {
      core.info(`Waiting for workload ${workload} to be available...`);
      if (controller === "cronjob") {
        core.setFailed(`Waiting for cronjob is not supported`);
        return;
      }

      const deadline = Date.now() + maxWaitMs;
      while (true) {
        if (Date.now() < deadline) {
          try {
            if (await strategy.isAvailable()) {
              core.info("Workload is available");
              break;
            }
            core.debug("sleep 5s");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            core.info(`Waiting for workload ${workload} to be available...`);
          } catch (err) {}
        } else {
          core.setFailed(
            `Timeout waiting for workload ${workload} to be available`,
          );
          return;
        }
      }
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

main();
