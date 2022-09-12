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
        .component('nclApiGatewayRow', {
            bindings: {
                actionHandlerCallback: '&',
                apiGateway: '<',
                apiGateways: '<',
                createApiGateway: '&',
                deleteApiGateway: '&',
                getFunctions: '&',
                isSplashShowed: '<',
                updateApiGateway: '&',
                updateFunction: '&',
                project: '<'
            },
            templateUrl: 'nuclio/api-gateways/api-gateway-row/api-gateway-row.tpl.html',
            controller: ApiGatewayRowController
        });

    function ApiGatewayRowController($scope, $timeout, $i18next, i18next, lodash, ngDialog, ActionCheckboxAllService,
                                     ApiGatewaysService, ConfigService, DialogsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.apiGatewayActions = [];
        ctrl.authModes = [];
        ctrl.nameTooltip = '';

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.getAuthModeName = getAuthModeName;
        ctrl.getCreatedBy = getCreatedBy;
        ctrl.onFireAction = onFireAction;

        ctrl.getCanaryName = ApiGatewaysService.getCanaryName;
        ctrl.getCanaryPercentage = ApiGatewaysService.getCanaryPercentage;
        ctrl.getPrimaryName = ApiGatewaysService.getPrimaryName;
        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.isSteadyState = ApiGatewaysService.isSteadyState;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.merge(ctrl.apiGateway, {
                ui: {
                    checked: false,
                    delete: deleteApiGateway,
                    edit: editApiGateway
                }
            });

            // initialize API gateway actions array
            ctrl.apiGatewayActions = ApiGatewaysService.initApiGatewayActions();

            // initialize API gateway authentication modes
            ctrl.authModes = ApiGatewaysService.getAuthModes();

            // populate both `ui.endpoint`
            ApiGatewaysService.buildEndpoint(ctrl.apiGateway);

            generateNameTooltip();

            $timeout(function () {
                if (ctrl.isSteadyState(ctrl.apiGateway)) {
                    ApiGatewaysService.hideStatusSpinner(ctrl.apiGateway);
                } else {
                    ApiGatewaysService.showStatusSpinner(ctrl.apiGateway);
                }
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (lodash.get(ctrl.apiGateway, 'ui.checked')) {
                lodash.set(ctrl.apiGateway, 'ui.checked', false);

                ActionCheckboxAllService.changeCheckedItemsCount(-1);
            }
        }

        //
        // Public methods
        //

        /**
         * Returns the authentication mode name corresponding to the API gateway's authentication mode.
         * @returns {string} the authentication mode name corresponding to the API gateway's authentication mode.
         */
        function getAuthModeName() {
            var modeId = lodash.get(ctrl.apiGateway, 'spec.authenticationMode');
            return lodash.chain(ctrl.authModes)
                .find(['id', modeId])
                .get('name', 'Unknown')
                .value();
        }

        /**
         * Returns the username who created API gateway.
         * @returns {string} the username.
         */
        function getCreatedBy() {
            var labels = lodash.get(ctrl.apiGateway, 'metadata.labels');
            var username = lodash.get(labels, 'iguazio.com/username', '');

            return lodash.get(username, 'value', '');
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({ actionType: actionType, checkedItems: [ctrl.apiGateway] });
        }

        //
        // Private methods
        //

        /**
         * Deletes API Gateway from API Gateways list
         * @returns {Promise}
         */
        function deleteApiGateway() {
            ctrl.isSplashShowed.value = true;

            return ctrl.deleteApiGateway({apiGateway: ctrl.apiGateway})
                .catch(function (error) {
                    ctrl.isSplashShowed.value = false;
                    var defaultMsg = $i18next.t('functions:ERROR_MSG.DELETE_API_GATEWAYS', { lng: lng });

                    return DialogsService.alert(lodash.get(error, 'data.error', defaultMsg));
                });
        }

        /**
         * Opens API gateway wizard for editing the current API gateway.
         */
        function editApiGateway() {
            ngDialog.open({
                template: '<ncl-new-api-gateway-wizard data-api-gateways="ngDialogData.apiGateways" ' +
                    'data-api-gateway="ngDialogData.apiGateway" ' +
                    'data-edit-wizard="ngDialogData.editWizard" ' +
                    'data-close-dialog="closeThisDialog({newApiGateway, taskId})" ' +
                    'data-ng-dialog-id="{{ngDialogData.ngDialogId}}" ' +
                    'data-project="ngDialogData.project" ' +
                    'data-create-api-gateway="ngDialogData.createApiGateway({apiGateway: apiGateway, projectName: projectName})" ' +
                    'data-update-api-gateway="ngDialogData.updateApiGateway({apiGateway: apiGateway, projectName: projectName})" ' +
                    'data-get-functions="ngDialogData.getFunctions({projectName: projectName})" ' +
                    'class="new-item-wizard igz-component"></ncl-new-api-gateway--wizard>',
                plain: true,
                scope: $scope,
                data: {
                    apiGateway: ctrl.apiGateway,
                    apiGateways: ctrl.apiGateways,
                    editWizard: true,
                    project: ctrl.project,
                    createApiGateway: ctrl.createApiGateway,
                    updateApiGateway: ctrl.updateApiGateway,
                    getFunctions: ctrl.getFunctions
                },
                className: 'ngdialog-new-item-wizard'
            }).closePromise
                .then(function (data) {
                    var newApiGateway = lodash.get(data, 'value.newApiGateway');

                    // if wizard was just closed without saving changes `newApiGateway` will be undefined
                    if (!lodash.isNil(newApiGateway)) {
                        lodash.set(newApiGateway, 'status.state', '');

                        // update row details with the changes from wizard (the wizard operates on a clone of the row)
                        lodash.merge(ctrl.apiGateway, newApiGateway);
                        ApiGatewaysService.buildEndpoint(ctrl.apiGateway);
                        generateNameTooltip();

                        // notify parent
                        ctrl.updateFunction({
                            apiGateway: ctrl.apiGateway
                        });
                    }
                });
        }

        /**
         * Generates the tooltip text message to display on hovering the API gateway's name.
         */
        function generateNameTooltip() {
            var spec = lodash.get(ctrl.apiGateway, 'spec', {});
            ctrl.nameTooltip = lodash.isEmpty(spec.description) ? spec.name :
                '<b>' + spec.name + '</b><br>' + spec.description;
        }
    }
}());
