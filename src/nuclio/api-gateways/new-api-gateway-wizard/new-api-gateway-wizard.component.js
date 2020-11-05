(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclNewApiGatewayWizard', {
            bindings: {
                apiGateway: '<',
                apiGateways: '<',
                closeDialog: '&',
                createApiGateway: '&',
                editWizard: '<',
                getFunctions: '&',
                ngDialogId: '@',
                project: '<',
                updateApiGateway: '&'
            },
            templateUrl: 'nuclio/api-gateways/new-api-gateway-wizard/new-api-gateway-wizard.tpl.html',
            controller: NewApiGatewayWizardController
        });

    function NewApiGatewayWizardController($q, $scope, $rootScope, $timeout, $i18next, i18next, lodash, ngDialog,
                                           ApiGatewaysService, DialogsService, ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        var CANARY_PERCENTAGE_INITIAL = 5;
        var FUNCTION_LIST_FETCH_POLL_DELAY = 3000;

        var functionsList = [];
        var suggestionsList = [];

        var promoteAction = {};
        var removeAction = {};

        ctrl.actions = [];
        ctrl.apiGatewayCopy = {};
        ctrl.apiGatewayForm = null;
        ctrl.authMode = [];
        ctrl.canaryUpstream = null;
        ctrl.canaryFunctionInput = 'canaryName';
        ctrl.functionFetchPanel = {
            state: null,
            messages: {
                failed: $i18next.t('functions:ERROR_MSG.FETCH_FUNCTION_LIST', { lng: lng })
            }
        };
        ctrl.primaryUpstream = null;
        ctrl.primaryFunctionInput = 'primaryName';
        ctrl.selectedAuthenticationType = null;
        ctrl.scrollConfig = {
            axis: 'yx',
            advanced: {
                updateOnContentResize: true,
                autoExpandHorizontalScroll: true
            },
            autoExpandScrollbar: true
        };
        ctrl.sliderConfig = {
            vertical: true,
            rightToLeft: true,
            hideLimitLabels: true,
            floor: 1,
            ceil: 99,
            hidePointerLabels: true
        };
        ctrl.usernameIsFocused = false;
        ctrl.validationRules = {
            apiGatewayName: ValidationService.getValidationRules('apiGateway.name')
        };

        ctrl.$onInit = onInit;

        ctrl.closeWizard = closeWizard;
        ctrl.createCanaryFunction = createCanaryFunction;
        ctrl.getActions = getActions;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isChangesHaveBeenMade = isChangesHaveBeenMade;
        ctrl.selectAuthType = selectAuthType;
        ctrl.selectSuggestion = selectSuggestion;
        ctrl.saveApiGateway = saveApiGateway;
        ctrl.updateSuggestionsList = updateSuggestionsList;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var authenticationType = lodash.get(ctrl.apiGateway, 'spec.authenticationMode', null);
            ctrl.authMode = ApiGatewaysService.getAuthModes();
            ctrl.selectedAuthenticationType = lodash.defaultTo(authenticationType, ctrl.authMode[0].id);

            initApiGateway();

            ctrl.primaryUpstream = ApiGatewaysService.getPrimary(ctrl.apiGateway);
            ctrl.canaryUpstream = ApiGatewaysService.getCanary(ctrl.apiGateway);

            populateFunctionList();

            $scope.$on('close-dialog-service_close-dialog', closeWizard);
        }

        //
        // Public methods
        //

        /**
         * Closes wizard or opens confirmation dialog if changes have been made
         */
        function closeWizard(event, data) {
            if (angular.isUndefined(event)) {
                if (ctrl.isChangesHaveBeenMade()) {
                    openConfirmCloseDialog();
                } else {
                    ctrl.closeDialog();
                }
            } else if (event.name === 'close-dialog-service_close-dialog') {
                if (ctrl.isChangesHaveBeenMade() && (ctrl.ngDialogId === data.dialogId)) {
                    openConfirmCloseDialog();
                } else if (!ctrl.isChangesHaveBeenMade() && (ctrl.ngDialogId === data.dialogId) ||
                    lodash.includes(data.dialogId, 'confirm-dialog')) {
                    ngDialog.close(data.dialogId);
                }
            }
        }

        /**
         * Creates a canary function
         */
        function createCanaryFunction() {
            if (lodash.isNil(ctrl.canaryUpstream)) {
                ctrl.canaryUpstream = {
                    kind: 'nucliofunction',
                    nucliofunction: {
                        name: ''
                    },
                    percentage: CANARY_PERCENTAGE_INITIAL
                };
                lodash.update(ctrl.apiGateway, 'spec.upstreams', function (upstreams) {
                    upstreams.push(ctrl.canaryUpstream);
                    return upstreams;
                });
            }
        }

        /**
         * Returns array of actions for canary function.
         * @returns {Array.<{label, id, icon, visible, active, handler}>} Array of actions for canary function.
         */
        function getActions() {
            var canaryInput = ctrl.apiGatewayForm[ctrl.canaryFunctionInput];
            promoteAction.active = lodash.isNil(canaryInput) ?
                !lodash.isEmpty(lodash.get(ctrl.canaryUpstream, 'nucliofunction.name')) :
                canaryInput.$valid;
            return ctrl.actions;
        }

        /**
         * Input callback
         * @param {string} newData - input's value
         * @param {string} field - field to set value
         */
        function inputValueCallback(newData, field) {
            if (!lodash.isNil(newData)) {
                lodash.set(ctrl.apiGateway, field, newData);

                if (!ctrl.editWizard) {
                    ApiGatewaysService.buildIngressHost(ctrl.apiGateway, ctrl.project);
                }

                $rootScope.$broadcast('wizard_changes-have-been-made', isChangesHaveBeenMade());
            }
        }

        /**
         * Tests whether or not changes has been made to the API gateway from its original state.
         * @returns {boolean} `true` in case changes have been made, or `false` otherwise.
         */
        function isChangesHaveBeenMade() {
            return !lodash.isEqual(ctrl.apiGateway, ctrl.apiGatewayCopy);
        }

        /**
         * Handles selecting a suggestion from the function-name auto-complete suggestion drop-down menu.
         * @param {string} newFunctionName - The new selected function name.
         * @param {string} inputName - The name of the input field.
         */
        function selectSuggestion(newFunctionName, inputName) {
            var upstream = inputName === ctrl.primaryFunctionInput ? ctrl.primaryUpstream : ctrl.canaryUpstream;

            // check the state of the new selected function name and open a confirmation dialog if necessary
            return checkFunctionState(newFunctionName)
                .then(function () {
                    // if the user confirms (or no confirmation was necessary) - set the new function name
                    updateUpstreamFunctionName(newFunctionName, upstream);
                });

            // if the user does not confirm - a rejected promise is returned and the auto-complete component will mark
            // the input field as invalid
        }

        /**
         * Type select callback
         * @param type {Object} - selected type
         * @param field {string} - model field
         */
        function selectAuthType(type, field) {
            var fieldToOmit = type.id !== 'basicAuth' && type.id !== 'oauth2' ? ''           :
                              type.id !== 'basicAuth'                         ? '.basicAuth' :
                              type.id !== 'oauth2'                            ? '.dexAuth'   : null;

            lodash.set(ctrl.apiGateway, field, type.id);

            ctrl.selectedAuthenticationType = type.id;
            ctrl.usernameIsFocused = true;

            if (type.id === 'oauth2') {
                lodash.set(ctrl.apiGateway.spec, 'authentication.dexAuth.redirectUnauthorizedToSignIn', false);
            }

            if (!lodash.isNil(fieldToOmit)) {
                ctrl.apiGateway.spec = lodash.omit(ctrl.apiGateway.spec, 'authentication' + fieldToOmit);
            }
        }

        /**
         * Opens confirmation dialog on wizard closing
         */
        function openConfirmCloseDialog() {
            DialogsService.confirm($i18next.t('common:CLOSE_WIZARD_CONFIRM', { lng: lng }),
                                   $i18next.t('common:QUIT_AND_DISCARD', { lng: lng }))
                .then(function () {
                    ctrl.closeDialog();
                });
        }

        /**
         * Saves/creates API Gateway.
         * @param {Event} event - The `submit` event.
         */
        function saveApiGateway(event) {
            event.preventDefault();
            if (ctrl.apiGatewayForm.$valid && ctrl.isChangesHaveBeenMade()) {
                ctrl.apiGatewayForm.$setSubmitted();
                var apiGateway = lodash.omit(ctrl.apiGateway, 'ui');
                lodash.update(apiGateway, 'spec.path', function (path) {
                    return lodash.trimStart(path, '/');
                });
                lodash.set(apiGateway, 'metadata.name', lodash.get(apiGateway, 'spec.name'));
                var promise = ctrl.editWizard ?
                    ctrl.updateApiGateway({apiGateway: apiGateway, projectName: ctrl.project.metadata.name}) :
                    ctrl.createApiGateway({apiGateway: apiGateway, projectName: ctrl.project.metadata.name});
                promise
                    .then(function () {
                        ctrl.closeDialog({ newApiGateway: apiGateway});
                    })
                    .catch(function (error) {
                        var errorMessage = lodash.get(error, 'data.errors[0].detail', error.statusText);

                        DialogsService.alert(errorMessage);
                    });
            }
        }

        /**
         * Updates suggestions list according to input field's value.
         * @param newData {string} - Input field's value.
         * @param inputName {string} - Input field's name.
         * @returns {Promise.<{suggestions: Array, more: boolean}>} A promise resolving to an array of suggestions and
         *     a flag indicating whether or not the suggestion list is partial.
         */
        function updateSuggestionsList(newData, inputName) {
            var upstream = inputName === ctrl.primaryFunctionInput ? ctrl.primaryUpstream : ctrl.canaryUpstream;
            var upstreamsFunctionNames = lodash.chain(ctrl.apiGateway)
                .get('spec.upstreams', [])
                .without(upstream)
                .map('nucliofunction.name')
                .value();
            suggestionsList = lodash.chain(functionsList)
                .filter(function (aFunction) {
                    var functionName = lodash.get(aFunction, 'metadata.name');
                    var functionApiGateways = lodash.chain(aFunction)
                        .get('status.apiGateways', [])      // get the function's list of related API GWs
                        .without(ctrl.apiGateway.spec.name) // remove current API GW name from list
                        .value();
                    var functionAlreadyUsedInThisApiGateway = lodash.includes(upstreamsFunctionNames, functionName);
                    var functionAlreadyUsedInAnotherApiGateway = !lodash.isEmpty(functionApiGateways);

                    return !functionAlreadyUsedInThisApiGateway &&
                        !functionAlreadyUsedInAnotherApiGateway &&
                        (lodash.isEmpty(lodash.trim(newData)) || lodash.includes(functionName, newData));
                })
                .map(function (aFunction) {
                    var name = lodash.get(aFunction, 'metadata.name');
                    var state = lodash.get(aFunction, 'status.state');
                    return {
                        value: name,
                        label: name,
                        additionalInfo: '(' + lodash.capitalize(state) + ')'
                    };
                })
                .value();

            return $q.when({
                suggestions: suggestionsList,
                more: false
            });
        }

        //
        // Private methods
        //

        /**
         * Opens confirmation dialog if a function is not running (disabled, failed, building) to let the user decide
         * whether or not to use this function.
         * @param functionName {string} - The function name.
         * @returns {Promise.<string>} A promise that resolves in case the user confirmed to use the given function
         *     name, or rejected otherwise.
         */
        function checkFunctionState(functionName) {
            var currentFunction = lodash.find(functionsList, ['metadata.name', functionName]);
            var ready = lodash.get(currentFunction, 'status.state') === 'ready';
            var disabled = lodash.get(currentFunction, 'spec.disable', false);

            // if the function is running (or no function was found) - return a resolved promise immediately
            return lodash.isUndefined(currentFunction) || ready && !disabled ? $q.when() :

                // otherwise, display a confirmation dialog to the user, which resolves on confirm and rejects otherwise
                DialogsService.confirm($i18next.t('functions:SELECT_FUNCTION_CONFIRM', { lng: lng }),
                                       $i18next.t('common:APPLY', { lng: lng }));
        }

        /**
         * Initializes the actions for action menu of canary function.
         */
        function initActions() {
            removeAction = {
                label: $i18next.t('common:REMOVE', { lng: lng }),
                id: 'remove',
                testId: 'api-gateways.wizard_remove-canary.action',
                icon: 'igz-icon-trash',
                visible: true,
                active: true,
                handler: removeCanaryFunction
            };
            promoteAction = {
                label: $i18next.t('functions:PROMOTE', { lng: lng }),
                id: 'promote',
                testId: 'api-gateways.wizard_promote-canary.action',
                icon: 'igz-icon-drag-arrow-up',
                visible: true,
                active: true,
                handler: promoteCanaryFunction
            };
            ctrl.actions = [promoteAction, removeAction];
        }

        /**
         * Initializing of `ctrl.apiGateway` default model
         */
        function initApiGateway() {
            // start by copying `ctrl.apiGateway` so it does not change the parent component's copy
            ctrl.apiGateway = angular.copy(ctrl.apiGateway);

            lodash.defaultsDeep(ctrl.apiGateway, {
                spec: {
                    name: '',
                    description: '',
                    path: '',
                    authenticationMode: 'none',
                    upstreams: []
                },
                metadata: {
                    labels: {
                        'nuclio.io/project-name': ctrl.project.metadata.name
                    }
                }
            });

            if (lodash.isEmpty(ctrl.apiGateway.spec.upstreams)) {
                ctrl.primaryUpstream = {
                    kind: 'nucliofunction',
                    nucliofunction: {
                        name: ''
                    },
                    percentage: 0
                };
                ctrl.apiGateway.spec.upstreams.push(ctrl.primaryUpstream);
            }

            if (!ctrl.editWizard) {
                ApiGatewaysService.buildIngressHost(ctrl.apiGateway, ctrl.project);
            }

            ctrl.apiGatewayCopy = angular.copy(ctrl.apiGateway);

            initActions();
        }

        /**
         * Populates the function list by fetching it from backend.
         * If fetch fails, shows a message to the user about the failure and retries fetch until successful.
         */
        function populateFunctionList() {
            ctrl.getFunctions({projectName: ctrl.project.metadata.name})
                .then(function (data) {
                    functionsList = data;
                    ctrl.functionFetchPanel.state = null; // hide toast panel
                })
                .catch(function () {
                    ctrl.functionFetchPanel.state = 'failed'; // show toast panel with failure style
                    $timeout(populateFunctionList, FUNCTION_LIST_FETCH_POLL_DELAY);
                });
        }

        /**
         * Promotes canary function to primary and removes old primary function
         */
        function promoteCanaryFunction() {
            DialogsService.confirm($i18next.t('functions:PROMOTE_CANARY_CONFIRM', { lng: lng }),
                                   $i18next.t('functions:PROMOTE', { lng: lng }))
                .then(function () {
                    lodash.set(ctrl.canaryUpstream, 'percentage', 0);

                    ctrl.primaryUpstream = ctrl.canaryUpstream;
                    ctrl.canaryUpstream = null;
                    lodash.set(ctrl.apiGateway, 'spec.upstreams', [ctrl.primaryUpstream]);

                    $rootScope.$broadcast('wizard_changes-have-been-made', isChangesHaveBeenMade());
                });
        }

        /**
         * Removes a canary function
         */
        function removeCanaryFunction() {
            ctrl.canaryUpstream = null;
            lodash.set(ctrl.apiGateway, 'spec.upstreams', [ctrl.primaryUpstream]);

            $rootScope.$broadcast('wizard_changes-have-been-made', isChangesHaveBeenMade());
        }

        /**
         * Updates function name
         * @param functionName {string} - the new data
         * @param upstream {string} - the name of the input
         */
        function updateUpstreamFunctionName(functionName, upstream) {
            lodash.set(upstream, 'nucliofunction.name', functionName);

            $rootScope.$broadcast('wizard_changes-have-been-made', isChangesHaveBeenMade());
        }
    }
}());
