# K8sSetImageAction

Update Rancher Deployment Image Address Action

## Usage

### Patch Deployment with Token

```yaml
- name: Update Workload
  uses: MultiMx/K8sSetImageAction@v0.7
  with:
    server: "https://my-cluster"
    token: "token-aaa:bbb"
    namespace: "default"
    workload: "ingress-nginx-controller"
    image: "registry.example/repo:tag"
```

### Patch and Wait Workload Ready

```yaml
- name: Update Workload
  uses: MultiMx/K8sSetImageAction@v0.7
  with:
    server: "https://my-cluster"
    token: "token-aaa:bbb"
    namespace: "default"
    workload: "ingress-nginx-controller"
    image: "registry.example/repo:tag"
    wait: true
    maxWaitDuration: "10m" # optional, default 5m
```

### Parameters

Options further down the list have higher priority. For example, if Option B is set, Option A will be ignored.

#### Workload

| Parameter         | Required | Default      | Description                             |
| :---------------- | :------: | :----------- | --------------------------------------- |
| `server`          |    O     |              | Kubeconfig cluster server               |
| `skipTLSVerify`   |    X     | `false`      | Skip server TLS verify                  |
| `token`           |    O     |              | Kubeconfig user token                   |
| `controller`      |    X     | `deployment` | Controller of workload                  |
| `namespace`       |    O     |              | Namespace of workload                   |
| `workload`        |    O     |              | Name of workload                        |
| `maxPatchRetry`   |    X     | `5`          | Max retry times for patch               |
| `wait`            |    X     | `false`      | Wait until workload ready               |
| `maxWaitDuration` |    X     | `5m`         | Max wait duration, will fail if timeout |

#### Patch Option A: Auto Body

| Parameter   | Required | Default       | Description              |
| :---------- |:--------:| :------------ | ------------------------ |
| `container` |    X     | `container-0` | Name of container        |
| `image`     |    O     |               | Target image field value |

#### Patch Option B: Custom Body

| Parameter     | Required | Default                                  | Description                            |
| :------------ |:--------:| :--------------------------------------- | -------------------------------------- |
| `contentType` |    X     | `application/strategic-merge-patch+json` | Content-Type header of patch operation |
| `body`        |    O     |                                          | JSON body of patch operation           |
