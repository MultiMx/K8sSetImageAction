package controllers

import (
	"errors"
	"fmt"
	"github.com/MultiMx/K8sSetImageAction/global"
	"github.com/MultiMx/K8sSetImageAction/pkg/kube"
	log "github.com/sirupsen/logrus"
	"time"
)

func SetImage(api *kube.Kube) error {
	var counter uint8
	for {
		e := api.SetImage(global.Config.Image)
		if e == nil {
			log.Infoln("success")
			return nil
		}
		counter++
		log.Errorln("request set image api failed: ", e)
		if counter >= 5 {
			return errors.New("failed: maximum number of attempts reached")
		}
		time.Sleep(time.Second)
	}
}

func WaitDeploymentAvailable(api *kube.Kube) error {
	var err = make(chan error)
	go func() {
		var counter uint8 = 0
		var ok bool
		var e error
		for {
			time.Sleep(time.Second)
			if ok, e = api.DeploymentFullAvailable(); e != nil {
				counter++
				log.Warnf("get deployment status failed: %v", e)
				if counter >= 5 {
					err <- errors.New("failed: maximum number of attempts reached")
					return
				}
				continue
			} else if ok {
				err <- nil
				return
			}
			counter = 0
		}
	}()
	select {
	case e := <-err:
		return e
	case <-time.After(time.Minute * 5):
		return fmt.Errorf("deployment available waiting timeout")
	}
}
