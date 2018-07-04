var azure = require('azure-storage');

var utils = require('./lib/utils');

const getContentSettings = (metadata = {}, filePath) => {
    const { contentType = '' } = metadata;
    return {
        ...metadata,
        contentType: typeof contentType === 'function' ? contentType(filePath)
            : contentType
    }
}

function apply(options, compiler) {

    // When assets are being emmited (not yet on file system)
    compiler.plugin('emit', function (compilation, callback) {
        
        var blobService = azure.createBlobService.apply(azure, options.blobService);
        blobService.createContainerIfNotExists(options.container.name,  options.container.options, function(error, result, response) {
            if(!error){
                var assets = utils.getAssets(compilation);
                assets.forEach(function(asset) {
                    blobService.createBlockBlobFromText(options.container.name, asset.filePath, asset.fileContent, { contentSettings: getContentSettings(options.metadata, asset.filePath) }, function(error, result, response) {
                        if(!error){
                            console.log("successfully uploaded '" + asset.filePath + "' to container '" + options.container.name + "'");
                        } else {
                            console.error(error);
                        }
                    });
                });

            } else {
                console.error(error);
            }
            callback();
        });
    });
}

function AzureStorageDeployWebpackPlugin(options) {

    // Simple pattern to be able to easily access plugin
    // options when the apply prototype is called
    return {
        apply: apply.bind(this, options)
    };
}

module.exports = AzureStorageDeployWebpackPlugin;
