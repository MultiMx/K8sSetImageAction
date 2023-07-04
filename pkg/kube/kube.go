package kube

import "strings"

type Kube struct {
	Conf *Config
}

func New(conf *Config) *Kube {
	conf.Backend = strings.TrimSuffix(conf.Backend, "/")
	if conf.Cluster == "" {
		conf.Cluster = "local"
	}
	if conf.Type == "" {
		conf.Type = "deployments"
	}
	return &Kube{
		Conf: conf,
	}
}
