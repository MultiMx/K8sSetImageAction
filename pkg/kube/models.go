package kube

import "fmt"

type Config struct {
	Backend     string `env:"BACKEND,required"`
	Cluster     string `env:"CLUSTER"`
	Namespace   string `env:"NAMESPACE,required"`
	Type        string `env:"TYPE"`
	Workload    string `env:"WORKLOAD,required"`
	Container   uint   `env:"CONTAINER"`
	BearerToken string `env:"TOKEN,required"`
}

func (a Config) DeploymentUrl() string {
	return fmt.Sprintf(
		"%s/k8s/clusters/%s/apis/apps/v1/namespaces/%s/%s/%s",
		a.Backend,
		a.Cluster,
		a.Namespace,
		a.Type,
		a.Workload,
	)
}

type Request struct {
	Url   string
	Query map[string]interface{}
	Body  interface{}
}
