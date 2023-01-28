package main

import (
	"github.com/MultiMx/K8sSetImageAction/controllers"
	"github.com/MultiMx/K8sSetImageAction/global"
	"github.com/MultiMx/K8sSetImageAction/pkg/kube"
	log "github.com/sirupsen/logrus"
)

func main() {
	api := kube.New(&global.Config.Config)

	e := controllers.SetImage(api)
	if e != nil {
		log.Fatalln(e)
	}

	if global.Config.Wait {
		log.Infoln("waiting...")
		if e = controllers.WaitDeploymentAvailable(api); e != nil {
			log.Fatalln(e)
		}
	}
}
