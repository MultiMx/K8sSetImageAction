package kube

type Config struct {
	Backend     string `env:"BACKEND,required"`
	Cluster     string `env:"CLUSTER"`
	Namespace   string `env:"NAMESPACE,required"`
	Deployment  string `env:"DEPLOYMENT,required"`
	Container   uint   `env:"CONTAINER"`
	BearerToken string `env:"TOKEN,required"`
}

type Request struct {
	Url   string
	Query map[string]interface{}
	Body  interface{}
}
