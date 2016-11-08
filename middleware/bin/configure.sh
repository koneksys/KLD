#!/bin/bash
# Author: Vorachet Jaroensawas <vorachet.jaroensawas@koneksys.com>

BASH_CLI_SCRIPT_NAME="npm run configure"

BASH_CLI_OPT_NAME[0]="-d"
BASH_CLI_OPT_NAME[1]="-p"
BASH_CLI_OPT_NAME[2]="-c"
BASH_CLI_OPT_NAME[3]="-g"
BASH_CLI_OPT_NAME[4]="-r"
BASH_CLI_OPT_NAME[5]="-f"
BASH_CLI_OPT_NAME[6]="-o"
BASH_CLI_OPT_NAME[7]="provisioning.delete" 
BASH_CLI_OPT_NAME[8]="fuseki.tdbs.delete" 
BASH_CLI_OPT_NAME[9]="solr.cores.delete" 
BASH_CLI_OPT_NAME[10]="provisioning.add"
BASH_CLI_OPT_NAME[11]="solr.cores.add" 
BASH_CLI_OPT_NAME[12]="patch.conf.add" 
BASH_CLI_OPT_NAME[13]="patch.conf.gen" 
BASH_CLI_OPT_NAME[14]="patch.conf.gen2dir"
BASH_CLI_OPT_NAME[15]="patch.data.add"
BASH_CLI_OPT_NAME[16]="patch.data.gen"
BASH_CLI_OPT_NAME[17]="patch.data.gen2dir"
BASH_CLI_OPT_NAME[18]="fuseki.start" 
BASH_CLI_OPT_NAME[19]="solr.start" 
BASH_CLI_OPT_NAME[20]="fuseki.stop" 
BASH_CLI_OPT_NAME[21]="solr.stop" 

BASH_CLI_OPT_ALT_NAME[0]="--dataset"
BASH_CLI_OPT_ALT_NAME[1]="--provisioning"
BASH_CLI_OPT_ALT_NAME[2]="--patch"
BASH_CLI_OPT_ALT_NAME[3]="--graph"
BASH_CLI_OPT_ALT_NAME[4]="--rdf"
BASH_CLI_OPT_ALT_NAME[5]="--format"
BASH_CLI_OPT_ALT_NAME[6]="--outputDir"
BASH_CLI_OPT_ALT_NAME[7]="delete-provisioning"
BASH_CLI_OPT_ALT_NAME[8]="delete-fuseki-tdbs" 
BASH_CLI_OPT_ALT_NAME[9]="delete-solr-cores" 
BASH_CLI_OPT_ALT_NAME[10]="add-provisioning" 
BASH_CLI_OPT_ALT_NAME[11]="add-solr-cores" 
BASH_CLI_OPT_ALT_NAME[12]="add-config-patch" 
BASH_CLI_OPT_ALT_NAME[13]="generate-config-patch" 
BASH_CLI_OPT_ALT_NAME[14]="generate-config-patch-to-outputdir" 
BASH_CLI_OPT_ALT_NAME[15]="add-data-patch" 
BASH_CLI_OPT_ALT_NAME[16]="generate-data-patch" 
BASH_CLI_OPT_ALT_NAME[17]="generate-data-patch-to-outputdir" 
BASH_CLI_OPT_ALT_NAME[18]="start-fuseki-server" 
BASH_CLI_OPT_ALT_NAME[19]="start-solr-server" 
BASH_CLI_OPT_ALT_NAME[20]="stop-fuseki-server" 
BASH_CLI_OPT_ALT_NAME[21]="stop-solr-server" 

BASH_CLI_OPT_DATA_TYPE[0]="string"
BASH_CLI_OPT_DATA_TYPE[1]="string"
BASH_CLI_OPT_DATA_TYPE[2]="string"
BASH_CLI_OPT_DATA_TYPE[3]="string"
BASH_CLI_OPT_DATA_TYPE[4]="string"
BASH_CLI_OPT_DATA_TYPE[5]="string"
BASH_CLI_OPT_DATA_TYPE[6]="string" 
BASH_CLI_OPT_DATA_TYPE[7]="cmd" 
BASH_CLI_OPT_DATA_TYPE[8]="cmd" 
BASH_CLI_OPT_DATA_TYPE[9]="cmd" 
BASH_CLI_OPT_DATA_TYPE[10]="cmd" 
BASH_CLI_OPT_DATA_TYPE[11]="cmd" 
BASH_CLI_OPT_DATA_TYPE[12]="cmd" 
BASH_CLI_OPT_DATA_TYPE[13]="cmd" 
BASH_CLI_OPT_DATA_TYPE[14]="cmd" 
BASH_CLI_OPT_DATA_TYPE[15]="cmd" 
BASH_CLI_OPT_DATA_TYPE[16]="cmd" 
BASH_CLI_OPT_DATA_TYPE[17]="cmd" 
BASH_CLI_OPT_DATA_TYPE[18]="cmd" 
BASH_CLI_OPT_DATA_TYPE[19]="cmd" 
BASH_CLI_OPT_DATA_TYPE[20]="cmd" 
BASH_CLI_OPT_DATA_TYPE[21]="cmd" 

BASH_CLI_MANDATORY_PARAM[7]="1"      # /bin/config.sh provisioning.delete -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[8]="1"      # /bin/config.sh fuseki.tdbs.delete  -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[9]="1"      # /bin/config.sh solr.cores.delete   -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[10]="1"      # /bin/config.sh provisioning.add    -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[11]="1"     # /bin/config.sh solr.cores.add      -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[12]="1,2"   # /bin/config.sh patch.conf.add      -p  provisioning.json -c patch.json 
BASH_CLI_MANDATORY_PARAM[13]="3,4"   # /bin/config.sh patch.conf.gen      -g "MyGraphName" -r data.rdf
BASH_CLI_MANDATORY_PARAM[14]="3,4,6" # /bin/config.sh patch.conf.gen2dir  -g "MyGraphName" -r data.rdf -o outputDir
BASH_CLI_MANDATORY_PARAM[15]="1,2,5" # /bin/config.sh patch.data.add      -p  provisioning.json -c patch.json 
BASH_CLI_MANDATORY_PARAM[16]="3,4,5" # /bin/config.sh patch.data.gen      -g "MyGraphName" -r data.rdf -f ttl
BASH_CLI_MANDATORY_PARAM[17]="3,4,6" # /bin/config.sh patch.data.gen2dir  -g "MyGraphName" -r data.rdf -o outputDir
BASH_CLI_MANDATORY_PARAM[18]="1"     # /bin/config.sh fuseki.start        -p  provisioning.json 
BASH_CLI_MANDATORY_PARAM[19]="1"     # /bin/config.sh solr.start          -p  provisioning.json
                                     # /bin/config.sh fuseki.stop
                                     # /bin/config.sh solr.stop

BASH_CLI_OPT_DESC[0]="string"
BASH_CLI_OPT_DESC[1]="string"
BASH_CLI_OPT_DESC[2]="string"
BASH_CLI_OPT_DESC[3]="string"
BASH_CLI_OPT_DESC[4]="string"
BASH_CLI_OPT_DESC[5]="string"
BASH_CLI_OPT_DESC[6]="string"
BASH_CLI_OPT_DESC[7]="Delete provisioning files" 
BASH_CLI_OPT_DESC[8]="Delete FUSEKI TDBs" 
BASH_CLI_OPT_DESC[9]="Delete SOLR Cores" 
BASH_CLI_OPT_DESC[10]="Add new provisioning" 
BASH_CLI_OPT_DESC[11]="ADD new SOLR Cores" 
BASH_CLI_OPT_DESC[12]="Patch new configuration to existing provisioning profile" 
BASH_CLI_OPT_DESC[13]="Genereate patch configuration from RDFXML"
BASH_CLI_OPT_DESC[14]="Genereate patch configuration from RDFXML and save to directory"
BASH_CLI_OPT_DESC[15]="Patch new data to existing provisioning profile" 
BASH_CLI_OPT_DESC[16]="Genereate patch data from RDFXML"
BASH_CLI_OPT_DESC[17]="Genereate patch data from RDFXML and save to directory"
BASH_CLI_OPT_DESC[18]="Start FUSEKI" 
BASH_CLI_OPT_DESC[19]="Start SOLR" 
BASH_CLI_OPT_DESC[20]="Stop FUSEKI" 
BASH_CLI_OPT_DESC[21]="Stop SOLR" 

provisioning.delete() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/delete.provisioning.js ${provisioning}
}

fuseki.tdbs.delete() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/delete.fuseki.tdbs.js ${provisioning}
}

solr.cores.delete() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/delete.solr.cores.js ${provisioning}
}

provisioning.add() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    echo "provisioning=${provisioning}"
    node bin/add.provisioning.js ${provisioning}
}

solr.cores.add() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/add.solr.cores.js ${provisioning}
}

patch.conf.add() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    local patch=${BASH_CLI_OPT_VALUE[2]}
    node bin/add.conf.patch.js ${provisioning} ${patch}
}

patch.conf.gen() {
    local graph=${BASH_CLI_OPT_VALUE[3]}
    local rdf=${BASH_CLI_OPT_VALUE[4]}
    node bin/gen.conf.patch.js ${graph} ${rdf}
}

patch.conf.gen2dir() {
    local graph=${BASH_CLI_OPT_VALUE[3]}
    local rdf=${BASH_CLI_OPT_VALUE[4]}
    local output=${BASH_CLI_OPT_VALUE[6]}
    node bin/gen.conf.patch.js ${graph} ${rdf} ${output}
}

patch.data.add() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    local patch=${BASH_CLI_OPT_VALUE[2]}
    local format=${BASH_CLI_OPT_VALUE[5]}
    node bin/add.data.patch.js ${provisioning} ${patch} ${format}
}

patch.data.gen() {
    local graph=${BASH_CLI_OPT_VALUE[3]}
    local rdf=${BASH_CLI_OPT_VALUE[4]}
    local format=${BASH_CLI_OPT_VALUE[5]}
    local output=${BASH_CLI_OPT_VALUE[6]}
    node bin/gen.data.patch.js ${graph} ${rdf} ${format} ${output}
}

patch.data.gen2dir() {
    local graph=${BASH_CLI_OPT_VALUE[3]}
    local rdf=${BASH_CLI_OPT_VALUE[4]}
    local format=${BASH_CLI_OPT_VALUE[5]}
    local output=${BASH_CLI_OPT_VALUE[6]}
    node bin/gen.data.patch.js ${graph} ${rdf} ${format} ${output}
}

fuseki.start() { 
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/fuseki.server.js start ${provisioning}
}

solr.start() {
    local provisioning=${BASH_CLI_OPT_VALUE[1]}
    node bin/solr.server.js start ${provisioning}
}

fuseki.stop() { 
    bin/stopFUSEKIServer.sh
}

solr.stop() {
    bin/stopSOLRServer.sh
}

source bin/base.sh