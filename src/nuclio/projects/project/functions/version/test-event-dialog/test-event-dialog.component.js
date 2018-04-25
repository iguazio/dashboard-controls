(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclTestEventDialog', {
            bindings: {
                closeDialog: '&',
                createEvent: '<',
                selectedEvent: '<',
                version: '<'

            },
            templateUrl: 'nuclio/projects/project/functions/version/test-event-dialog/test-event-dialog.tpl.html',
            controller: NclTestEventDialogController
        });

    function NclTestEventDialogController($scope, lodash, EventHelperService, NuclioEventService) {
        var ctrl = this;

        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.buttonText = 'Create';
        ctrl.errorText = 'Error occurred while creating the new test event.';
        ctrl.titleText = 'Create test event';
        ctrl.isLoadingState = false;
        ctrl.isDeployFailed = false;
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
                ctrl.titleText = 'Edit test event';
                ctrl.buttonText = 'Apply';
                ctrl.errorText = 'Error occurred while updating the test event.';
            }

            ctrl.selectedEvent = ctrl.createEvent ? {} : ctrl.selectedEvent;
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
                        }
                    },
                    body: ''
                }
            });

            // copy event to prevent modifying  the original object
            ctrl.workingCopy = angular.copy(ctrl.selectedEvent);

            ctrl.selectedMethod = lodash.find(ctrl.methods, ['id' , lodash.get(ctrl.selectedEvent, 'spec.attributes.method')]);
            ctrl.selectedHeader = lodash.find(ctrl.headers, ['id' , lodash.get(ctrl.selectedEvent, 'spec.attributes.headers.Content-Type')]);
        }


        //
        // Public methods
        //

        /**
         * Disables Edit mode and sends broadcast to nested settings component
         * @param {Event} event - JS event object
         */
        function applyChanges(event) {

            ctrl.testEventForm.$submitted = true;

            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && ctrl.testEventForm.$valid) {

                // show "Loading..." button
                ctrl.isLoadingState = true;

                NuclioEventService.deployEvent(ctrl.workingCopy, ctrl.createEvent)
                    .then(function (response) {
                        ctrl.isDeployFailed = false;

                        ctrl.closeDialog({isEventDeployed: true})
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
                ctrl.closeDialog({isEventDeployed: false})
            }
        }

        /**
         * Sets new data from "Name" field to event object
         * @param {string} newData - data to be set
         * @param {string} field - field which was changed
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.workingCopy, 'spec.displayName', newData);
        }

        /**
         * Callback from method drop-down
         * @param {Object} item - new selected item
         */
        function onSelectMethod(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.method', item.id);
        }

        /**
         * Callback from Content Type drop-down
         * @param {Object} item - new selected item
         */
        function onSelectHeader(item) {
            lodash.set(ctrl.workingCopy, 'spec.attributes.headers.Content-Type', item.id);
        }

    }
}());
