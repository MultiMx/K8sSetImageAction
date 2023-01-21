package kube

import (
	"fmt"
	"github.com/Mmx233/tool"
	"github.com/MultiMx/K8sSetImageAction/util"
	"io"
	"net/http"
)

func (a Kube) Request(Type string, req *Request) (*http.Response, error) {
	res, e := util.Http.Request(Type, &tool.DoHttpReq{
		Url: req.Url,
		Header: map[string]interface{}{
			"User-Agent":    "curl/7.72.0",
			"Accept":        "*/*",
			"Content-Type":  "application/json-patch+json",
			"Authorization": "bearer " + a.Conf.BearerToken,
		},
		Query: req.Query,
		Body:  req.Body,
	})
	if e != nil {
		return nil, e
	}
	if res.StatusCode == 200 || res.StatusCode == 201 {
		return res, nil
	}
	d, e := io.ReadAll(res.Body)
	if e != nil {
		return nil, e
	}
	return nil, fmt.Errorf("server throw error, http status %d : %s", res.StatusCode, string(d))
}
