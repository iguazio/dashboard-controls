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
        .component('nclFunctionVersionRow', {
            bindings: {
                actionHandlerCallback: '&',
                convertedStatusState: '<',
                function: '<',
                isFunctionCollapsed: '<',
                project: '<',
                statusIcon: '<',
                statusStateClasses: '<',
                toggleFunctionState: '&',
                version: '<',
                versionsList: '<'
            },
            templateUrl: 'nuclio/functions/function-collapsing-row/function-version-row/function-version-row.tpl.html',
            controller: NclFunctionVersionRowController
        });

    function NclFunctionVersionRowController($state, $i18next, i18next, lodash, ActionCheckboxAllService, ConfigService,
                                             FunctionsService, TableSizeService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.functionMetrics = FunctionsService.functionMetrics;
        ctrl.versionActions = [];
        ctrl.runtimes = {
            'golang': 'Go',
            'python:2.7': 'Python 2.7',
            'python:3.6': 'Python 3.6',
            'python:3.7': 'Python 3.7',
            'python:3.8': 'Python 3.8',
            'python:3.9': 'Python 3.9',
            'dotnetcore': '.NET Core',
            'java': 'Java',
            'nodejs': 'NodeJS',
            'shell': 'Shell',
            'ruby': 'Ruby'
        };
        ctrl.title = null;

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.onFireAction = onFireAction;
        ctrl.onSelectRow = onSelectRow;
        ctrl.onToggleFunctionState = onToggleFunctionState;

        ctrl.functionsService = FunctionsService;
        ctrl.getFunctionsTableColSize = TableSizeService.getFunctionsTableColSize;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.lodash = lodash;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.title = {
                project: ctrl.project,
                function: ctrl.function.metadata.name,
                version: ctrl.version.name
            };

            lodash.defaultsDeep(ctrl.version, {
                ui: {
                    checked: false,
                    delete: deleteVersion,
                    edit: editVersion
                }
            });

            initVersionActions();
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (lodash.get(ctrl.version, 'ui.checked')) {
                lodash.set(ctrl.version, 'ui.checked', false);

                ActionCheckboxAllService.changeCheckedItemsCount(-1);
            }
        }

        //
        // Public methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.version] });
        }

        /**
         * Handles mouse click on a table row and navigates to Code page
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function onSelectRow(event, state) {
            if (
                lodash.isNil(event.target.closest('.igz-action-item')) &&
                lodash.isNil(event.target.closest('.actions-more-info'))
            ) {
                if (!angular.isString(state)) {
                    state = 'app.project.function.edit.code';
                }

                event.preventDefault();
                event.stopPropagation();

                $state.go(state, {
                    id: ctrl.project.metadata.name,
                    projectId: ctrl.project.metadata.name,
                    functionId: ctrl.function.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace
                });
            }
        }

        /**
         * Handles mouse click on toggle function state
         * @param {MouseEvent} event
         */
        function onToggleFunctionState(event) {
            ctrl.toggleFunctionState({ event: event })
        }

        //
        // Private methods
        //

        /**
         * Deletes project from projects list
         */
        function deleteVersion() {
            // TODO no versions till now
        }

        /**
         * Opens `Edit project` dialog
         */
        function editVersion() {
            $state.go('app.project.function.edit.code', {
                projectId: ctrl.project.metadata.name,
                functionId: ctrl.function.metadata.name,
                projectNamespace: ctrl.project.metadata.namespace
            });
        }

        /**
         * Initializes version actions
         */
        function initVersionActions() {
            ctrl.versionActions = angular.copy(FunctionsService.initVersionActions());

            var deleteAction = lodash.find(ctrl.versionActions, { id: 'delete' });

            if (!lodash.isNil(deleteAction)) {
                deleteAction.confirm.message = $i18next.t('functions:DELETE_VERSION', { lng: lng }) + ' “' +
                    ctrl.version.name + '”?'
            }
        }
    }
}());
