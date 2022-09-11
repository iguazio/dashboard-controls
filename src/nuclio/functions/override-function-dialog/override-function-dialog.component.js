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
        .component('nclOverrideFunctionDialog', {
            bindings: {
                closeDialog: '&',
                existingFunction: '<',
                newFunction: '<',
                project: '<'
            },
            templateUrl: 'nuclio/functions/override-function-dialog/override-function-dialog.tpl.html',
            controller: OverrideFunctionDialogController
        });

    function OverrideFunctionDialogController($state, lodash, EventHelperService) {
        var ctrl = this;

        ctrl.onClose = onClose;
        ctrl.openExistingFunction = openExistingFunction;
        ctrl.overrideFunction = overrideFunction;

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                ctrl.closeDialog();
            }
        }

        /**
         * Opens the existing function
         */
        function openExistingFunction() {
            var projectName = lodash.get(ctrl.existingFunction, ['metadata', 'labels', 'nuclio.io/project-name']);

            $state.go('app.project.function.edit.code', {
                id: projectName,
                projectId: projectName,
                projectNamespace: ctrl.project.metadata.namespace,
                functionId: ctrl.existingFunction.metadata.name
            });

            ctrl.closeDialog();
        }

        /**
         * Overrides the existing function
         */
        function overrideFunction() {
            lodash.merge(ctrl.newFunction, {
                status: {
                    state: ''
                },
                ui: {
                    overwrite: true
                }
            });

            $state.go('app.project.function.edit.code', {
                isNewFunction: true,
                id: ctrl.project.metadata.name,
                projectId: ctrl.project.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace,
                functionId: ctrl.newFunction.metadata.name,
                functionData: ctrl.newFunction
            });

            ctrl.closeDialog();
        }
    }
}());
