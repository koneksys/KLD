#! /bin/bash

kill -9 `ps -ef | grep 'solr' | grep -v grep | awk '{ print $2 }'`