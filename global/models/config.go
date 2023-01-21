package models

import "github.com/MultiMx/K8sSetImageAction/pkg/kube"

type Config struct {
	kube.Config
	Image string `env:"IMAGE,required"`
}
