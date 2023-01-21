package kube

import "fmt"

type Config struct {
	Backend     string `env:"BACKEND,required"`
	Cluster     string `env:"CLUSTER"`
	Namespace   string `env:"NAMESPACE,required"`
	Deployment  string `env:"DEPLOYMENT,required"`
	Container   uint   `env:"CONTAINER"`
	BearerToken string `env:"TOKEN,required"`
}

func (a Config) DeploymentUrl() string {
	return fmt.Sprintf(
		"%s/k8s/clusters/%s/apis/apps/v1/namespaces/%s/deployments/%s",
		a.Backend,
		a.Cluster,
		a.Namespace,
		a.Deployment,
	)
}

type Request struct {
	Url   string
	Query map[string]interface{}
	Body  interface{}
}
