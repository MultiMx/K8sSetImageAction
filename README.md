# K8sSetImageAction

Update Rancher Deployment Image Address Action

## Usage

```yaml
- name: Update Deployment
  uses: MultiMx/K8sSetImageAction@v0.6
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
