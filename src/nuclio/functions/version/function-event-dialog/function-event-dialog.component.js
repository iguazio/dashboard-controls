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
        .component('nclFunctionEventDialog', {
            bindings: {
                closeDialog: '&',
                createEvent: '<',
                selectedEvent: '<',
                version: '<',
                createFunctionEvent: '&'
            },
            templateUrl: 'nuclio/functions/version/function-event-dialog/function-event-dialog.tpl.html',
            controller: NclFunctionEventDialogController
        });

    function NclFunctionEventDialogController($timeout, $i18next, i18next, lodash, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.buttonText = $i18next.t('common:CREATE', {lng: lng});
        ctrl.errorText = $i18next.t('functions:ERROR_MSG.CREATE_FUNCTION_EVENT', {lng: lng});
        ctrl.titleText = $i18next.t('functions:CREATE_FUNCTION_EVENT', {lng: lng});
        ctrl.contentType = 'application/json';
        ctrl.bodyTheme = 'vs-light';
        ctrl.isLoadingState = false;
        ctrl.isDeployFailed = false;
        ctrl.isFormChanged = false;
        ctrl.methods = [
            {
                id: 'POST',
                visible: true,
                name: 'POST'
            },
            {
                id: 'GET',
                visible: true,
                name: 'GET'
            },
            {
                id: 'PUT',
                visible: true,
                name: 'PUT'
            },
            {
                id: 'PATCH',
                visible: true,
                name: 'PATCH'
            },
            {
                id: 'DELETE',
                visible: true,
                name: 'DELETE'
            }
        ];
        ctrl.headers = [
            {
                id: 'application/json',
                visible: true,
                name: 'JSON'
            },
            {
                id: 'text/plain',
                visible: true,
                name: 'Plain text'
            }
        ];
        ctrl.selectedMethod = null;
        ctrl.selectedHeader = null;
        ctrl.workingCopy = null;

        ctrl.$onInit = onInit;

        ctrl.applyChanges = applyChanges;
        ctrl.closeEventDialog = closeEventDialog;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onChangeBody = onChangeBody;
        ctrl.onChangeSourceCode = onChangeSourceCode;
        ctrl.onSelectHeader = onSelectHeader;
        ctrl.onSelectMethod = onSelectMethod;

        //
        // Hooks method
        //

        /**
         * Init method
         */
        function onInit() {

            // check if dialog was opened to create event, or edit existing event.
            // if ctrl.createEvent is 'true', that mean dialog was open to create new event.
            // otherwise, for edit existing event, so need to change all corresponding labels.
            if (!ctrl.createEvent) {
                ctrl.titleText = $i18next.t('functions:EDIT_FUNCTION_EVENT', {lng: lng});
                ctrl.buttonText = $i18next.t('common:APPLY', {lng: lng});
                ctrl.errorText = $i18next.t('functions:ERROR_MSG.UPDATE_FUNCTION_EVENT', {lng: lng});
            }

            // if ctrl.selectedEvent hasn't specific fields, that means event was not deployed before, so fill it with default data
            lodash.defaultsDeep(ctrl.selectedEvent, {
                metadata: {
                    namespace: lodash.get(ctrl.version, 'metadata.namespace'),
                    labels: {
                        'nuclio.io/function-name': lodash.get(ctrl.version, 'metadata.name')
                    }
                },
                spec: {
                    displayName: '',
                    triggerKind: 'http',
                    attributes: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        path: ''
                    },
                    body: ''
                }
            });

            // copy event to prevent modifying the original object
            ctrl.workingCopy = angular.copy(ctrl.selectedEvent);

            // get method from event.
            ctrl.selectedMethod = lodash.find(ctrl.methods, ['id' , lodash.get(ctrl.selectedEvent, 'spec.attributes.method')]);

            // get content type from event.
            ctrl.contentType = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers.Content-Type');

            // get header from event.
            ctrl.selectedHeader = lodash.find(ctrl.headers, ['id' , ctrl.contentType]);
        }

        //
        // Public methods
        //

        /**
         * Saves newly created event on beck-end.
         * If error occurs while saving event, then dialog remains open.
         * @param {Event} event - JS event object
         */
        function applyChanges(event) {
            ctrl.functionEventForm.$setSubmitted();

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                (ctrl.functionEventForm.$valid && ctrl.isFormChanged)) {

                // show 'Loading...' button
                ctrl.isLoadingState = true;

                // save created event on beck-end
                ctrl.createFunctionEvent({eventData: ctrl.workingCopy, isNewEvent: ctrl.createEvent})
                    .then(function () {
                        ctrl.isDeployFailed = false;

                        // close dialog with newly created or updated event data, and state of event.
                        ctrl.closeDialog({
                            result: {
                                isEventDeployed: true, // If isEventDeployed is 'true' that mean - dialog was closed after creating event, not by pressing 'X' button.
                                selectedEvent: ctrl.workingCopy
                            }
                        });
                    })
                    .catch(function () {

                        // dialog remains open.
                        // show error text
                        ctrl.isDeployFailed = true;

                        // hide 'Loading...' button
                        ctrl.isLoadingState = false;
                    });
            }
        }

        /**
         * Closes dialog
         */
        function closeEventDialog() {

            // close dialog only if event is not deploying. Means event was deployed / failed / not changed
            if (!ctrl.isLoadingState) {
                ctrl.closeDialog({
                    result: {
                        isEventDeployed: false,
                        selectedEvent: ctrl.selectedEvent
                    }
                });
            }
        }

        /**
         * Sets new data from "Name" field to event object
         * @param {string} newData - data to be set
         * @param {string} field - field which was changed
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.workingCopy.spec, field === 'path' ? 'attributes.path' : field, newData);

            isFormChanged();
        }

        /**
         * Callback from method drop-down
         * Sets new selected method
         * @param {Object} item - new selected item
         */
        function onSelectMethod(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.method', item.id);

            isFormChanged();
        }

        /**
         * Callback from Content Type drop-down
         * Sets new selected header
         * @param {Object} item - new selected item
         */
        function onSelectHeader(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.headers.Content-Type', item.id);
            ctrl.contentType = item.id;

            isFormChanged();
        }

        /**
         * Callback from body field.
         */
        function onChangeBody() {
            isFormChanged();
        }

        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.workingCopy, 'spec.body', sourceCode);

            isFormChanged();
        }

        //
        // Private methods
        //

        /**
         * Compares original object and working object to get know if fields was changed
         * Also check if form valid and set result to corresponding variable
         */
        function isFormChanged() {
            $timeout(function () {
                ctrl.isFormChanged = !lodash.isEqual(ctrl.workingCopy, ctrl.selectedEvent) && lodash.isEmpty(ctrl.functionEventForm.$error);
            });
        }
    }
}());
