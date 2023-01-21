package kube

import (
	"bytes"
	"fmt"
)

func (a Kube) SetImage(image string) error {
	res, e := a.Request("PATCH", &Request{
		Url: fmt.Sprintf(
			"https://%s/k8s/clusters/%s/apis/apps/v1/namespaces/%s/deployments/%s",
			a.Conf.Backend,
			a.Conf.Cluster,
			a.Conf.Namespace,
			a.Conf.Deployment,
		),
		Body: bytes.NewBuffer([]byte(fmt.Sprintf(`[{"op": "replace", "path": "/spec/template/spec/containers/%d/image", "value": "%s"}]`, a.Conf.Container, image))),
	})
	if e != nil {
		return e
	}
	_ = res.Body.Close()
	return nil
}
