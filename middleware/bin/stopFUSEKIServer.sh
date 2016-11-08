#! /bin/bash

kill -9 `ps -ef | grep 'fuseki' | grep -v grep | awk '{ print $2 }'`