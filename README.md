# K8sSetImageAction

更新 Rancher Deployment 镜像地址 Action

## 使用

```yaml
- name: Update Deployment
  uses: MultiMx/K8sSetImageAction@v0.5
  with:
    backend: 'https://some.rancher.com'
    token: ${{ secrets.CATTLE_TOKEN }} # rancher api bearer token
    namespace: 'control'
    workload: 'apicenter'
    image: image.url:version
    type: daemonsets # optional, default deployments
    container: 1 # optional, container index number, default 0
    wait: true # optional, wait for deployment full available, default false
    cluster: some_cluster # optional, cluster name, default local
```
