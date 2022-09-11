/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfiguration', {
            bindings: {
                version: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/version-configuration.tpl.html',
            controller: NclVersionConfigurationController
        });

    function NclVersionConfigurationController(lodash, ConfigService, VersionHelperService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.isDemoMode = ConfigService.isDemoMode;

        ctrl.isRuntimeBlockVisible = isRuntimeBlockVisible;
        ctrl.onConfigurationChangeCallback = onConfigurationChangeCallback;

        //
        // Public methods
        //

        /**
         * Checks if `Runtime Attributes` block is visible
         * @returns {boolean}
         */
        function isRuntimeBlockVisible() {
            return lodash.includes(['shell', 'java'], lodash.get(ctrl.version, 'spec.runtime'));
        }

        /**
         * Checks if version's configuration was changed
         */
        function onConfigurationChangeCallback() {
            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }
    }
}());
