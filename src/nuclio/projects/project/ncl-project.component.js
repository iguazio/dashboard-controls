(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProject', {
            bindings: {},
            templateUrl: 'nuclio/projects/project/ncl-project.tpl.html',
            controller: NclProjectController
        });

    function NclProjectController(ConfigService, DialogsService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            NuclioProjectsDataService.getExternalIPAddresses()
                .then(function (response) {
                    ConfigService.externalIPAddress = response.data.externalIPAddresses.addresses[0];
                })
                .catch(function () {
                    DialogsService.alert('Oops: Unknown error occurred while retrieving external IP address');
                });
        }
    }
}());
