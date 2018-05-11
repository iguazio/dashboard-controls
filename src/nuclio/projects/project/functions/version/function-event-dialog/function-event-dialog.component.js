(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionEventDialog', {
            bindings: {
                closeDialog: '&',
                createEvent: '<',
                selectedEvent: '<',
                version: '<'

            },
            templateUrl: 'nuclio/projects/project/functions/version/function-event-dialog/function-event-dialog.tpl.html',
            controller: NclFunctionEventDialogController
        });

    function NclFunctionEventDialogController($timeout, lodash, EventHelperService, NuclioEventService) {
        var ctrl = this;

        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.buttonText = 'Create';
        ctrl.errorText = 'Error occurred while creating the new function event.';
        ctrl.titleText = 'Create function event';
        ctrl.contentType = 'application/json';
        ctrl.bodyTheme = 'vs';
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

            // check if dialog was opened to create or edit test event.
            if (!ctrl.createEvent) {
                ctrl.titleText = 'Edit function event';
                ctrl.buttonText = 'Apply';
                ctrl.errorText = 'Error occurred while updating the function event.';
            }

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
                            'Content-Type': 'application/json',
                            'x-nuclio-path': ''
                        }
                    },
                    body: ''
                }
            });

            // copy event to prevent modifying  the original object
            ctrl.workingCopy = angular.copy(ctrl.selectedEvent);

            ctrl.selectedMethod = lodash.find(ctrl.methods, ['id' , lodash.get(ctrl.selectedEvent, 'spec.attributes.method')]);
            ctrl.contentType = lodash.get(ctrl.selectedEvent, 'spec.attributes.headers.Content-Type');
            ctrl.selectedHeader = lodash.find(ctrl.headers, ['id' , ctrl.contentType]);
        }

        //
        // Public methods
        //

        /**
         * Disables Edit mode and sends broadcast to nested settings component
         * @param {Event} event - JS event object
         */
        function applyChanges(event) {
            ctrl.functionEventForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                (ctrl.functionEventForm.$valid && ctrl.isFormChanged)) {

                // show "Loading..." button
                ctrl.isLoadingState = true;

                NuclioEventService.deployEvent(ctrl.workingCopy, ctrl.createEvent)
                    .then(function (response) {
                        ctrl.isDeployFailed = false;

                        ctrl.closeDialog({
                            result: {
                                isEventDeployed: true,
                                selectedEvent: ctrl.createEvent ? response.data : ctrl.selectedEvent
                            }
                        });
                    })
                    .catch(function () {
                        ctrl.isDeployFailed = true;
                        ctrl.isLoadingState = false;
                    });
            }
        }

        /**
         * Closes dialog
         */
        function closeEventDialog() {
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
            lodash.set(ctrl.workingCopy.spec, field === 'x-nuclio-path' ? 'attributes.headers["x-nuclio-path"]' : field, newData);

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
