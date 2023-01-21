package main

import (
	"github.com/MultiMx/K8sSetImageAction/global"
	"github.com/MultiMx/K8sSetImageAction/pkg/kube"
	log "github.com/sirupsen/logrus"
	"time"
)

func main() {
	api := kube.New(&global.Config.Config)

	var counter uint8
	for {
		e := api.SetImage(global.Config.Image)
		if e == nil {
			log.Infoln("success")
			return
		}
		counter++
		log.Errorln("Request redeploy failed: ", e)
		if counter >= 5 {
			log.Fatalln("Failed: maximum number of attempts reached.")
		}
		time.Sleep(time.Second)
	}
}
