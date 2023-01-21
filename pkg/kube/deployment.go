package kube

import (
	"bytes"
	"encoding/json"
	"fmt"
)

func (a Kube) SetImage(image string) error {
	res, e := a.Request("PATCH", &Request{
		Url:  a.Conf.DeploymentUrl(),
		Body: bytes.NewBuffer([]byte(fmt.Sprintf(`[{"op": "replace", "path": "/spec/template/spec/containers/%d/image", "value": "%s"}]`, a.Conf.Container, image))),
	})
	if e != nil {
		return e
	}
	_ = res.Body.Close()
	return nil
}

func (a Kube) DeploymentFullAvailable() (bool, error) {
	res, e := a.Request("GET", &Request{
		Url: a.Conf.DeploymentUrl(),
	})
	if e != nil {
		return false, e
	}
	defer res.Body.Close()

	var data struct {
		Status struct {
			Replicas          uint `json:"replicas"`
			AvailableReplicas uint `json:"availableReplicas"`
		} `json:"status"`
	}
	return data.Status.Replicas == data.Status.AvailableReplicas, json.NewDecoder(res.Body).Decode(&data)
}
