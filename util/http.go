package util

import (
	"github.com/Mmx233/tool"
	"net/http"
	"time"
)

var Http *tool.Http

func init() {
	defaultTimeout := time.Second * 30

	Http = tool.NewHttpTool(tool.GenHttpClient(&tool.HttpClientOptions{
		Transport: &http.Transport{
			TLSHandshakeTimeout: defaultTimeout,
			Proxy:               http.ProxyFromEnvironment,
		},
		Timeout: defaultTimeout,
	}))
}
