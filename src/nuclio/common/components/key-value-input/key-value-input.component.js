(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclKeyValueInput', {
            bindings: {
                actionHandlerCallback: '&',
                additionalValueOptional: '<?',
                allowSelection: '<?',
                allValueTypes: '<',
                changeDataCallback: '&',
                changeStateBroadcast: '@?',
                dropdownOverlap: '<?',
                isDisabled: '<?',
                itemIndex: '<',
                keyOptional: '<?',
                keyPlaceholder: '@?',
                keyValidationPattern: '<?',
                listClass: '@?',
                onlyValueInput: '<?',
                rowData: '<',
                submitOnFly: '<?',
                useAdditionalValue: '<?',
                useLabels: '<',
                useType: '<',
                validationRules: '<?',
                valueOptional: '<?',
                valuePlaceholder: '@?',
                valueValidationPattern: '<?'
            },
            templateUrl: 'nuclio/common/components/key-value-input/key-value-input.tpl.html',
            controller: NclKeyValueInputController
        });

    function NclKeyValueInputController($document, $element, $rootScope, $scope, $timeout, $i18next, i18next, lodash,
                                        DialogsService, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.data = {};
        ctrl.typesList = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.closeDropdown = closeDropdown;
        ctrl.onEditInput = onEditInput;
        ctrl.getInputValue = getInputValue;
        ctrl.getInputKey = getInputKey;
        ctrl.getType = getType;
        ctrl.isVisibleByType = isVisibleByType;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.inputKeyCallback = inputKeyCallback;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.openDropdown = openDropdown;
        ctrl.onTypeChanged = onTypeChanged;
        ctrl.showDotMenu = showDotMenu;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.actions = initActions();
            ctrl.data = lodash.cloneDeep(ctrl.rowData);
            ctrl.editMode = lodash.get(ctrl.data, 'ui.editModeActive', false);
            ctrl.typesList = getTypesList();

            lodash.defaults(ctrl, {
                allowSelection: false,
                dropdownOverlap: false,
                keyOptional: false,
                keyPlaceholder: $i18next.t('functions:PLACEHOLDER.ENTER_KEY', {lng: lng}),
                onlyValueInput: false,
                isDisabled: false,
                submitOnFly: false,
                useAdditionalValue: false,
                valuePlaceholder: $i18next.t('functions:PLACEHOLDER.ENTER_VALUE', {lng: lng}),
            });

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);

            $scope.$on('action-checkbox_item-checked', function () {
                if (angular.isFunction(ctrl.changeDataCallback)) {
                    ctrl.changeDataCallback({newData: ctrl.data, index: ctrl.itemIndex});
                }
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);

            if (angular.isDefined(ctrl.changeStateBroadcast)) {
                $rootScope.$broadcast(ctrl.changeStateBroadcast, {component: ctrl.data.ui.name, isDisabled: ctrl.keyValueInputForm.$invalid});
            }
        }

        //
        // Public methods
        //

        /**
         * Gets model for value input
         * @returns {string}
         */
        function getInputValue() {
            if (ctrl.useType) {
                var specificType = ctrl.getType() === 'value'     ? 'value' :
                                   ctrl.getType() === 'configmap' ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
                var value = lodash.get(ctrl.data, specificType);

                return specificType === 'value' ? value : value.name;
            } else {
                return ctrl.data.value;
            }
        }

        /**
         * Gets model for value-key input
         * @returns {string}
         */
        function getInputKey() {
            if (ctrl.useType && ctrl.getType() !== 'value') {
                var specificType = ctrl.getType() === 'configmap' ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
                var value = lodash.get(ctrl.data, specificType);

                return value.key;
            } else {
                return null;
            }
        }

        /**
         * Gets selected type
         * @returns {string}
         */
        function getType() {
            return !ctrl.useType || lodash.isNil(ctrl.data.valueFrom) ? 'value'     :
                   lodash.isNil(ctrl.data.valueFrom.secretKeyRef)     ? 'configmap' : 'secret';
        }

        /**
         * Check whether the block visibility match the given type
         * @param {string} type
         * @returns {boolean}
         */
        function isVisibleByType(type) {
            return type === ctrl.getType();
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(field, 'value') && ctrl.getType() !== 'value') {

                lodash.assign(lodash.get(ctrl.data, getValueField()), {
                    name: newData
                });

            } else {
                ctrl.data[field] = newData;
            }

            if (ctrl.submitOnFly) {
                saveChanges();
            }
        }

        /**
         * Update data callback
         * @param {string} newData
         */
        function inputKeyCallback(newData) {
            lodash.assign(lodash.get(ctrl.data, getValueField()), {
                key: newData
            });

            if (ctrl.submitOnFly) {
                saveChanges();
            }
        }

        /**
         * Handler on action click
         * @param {Object} action - action that was clicked (e.g. `delete`)
         */
        function onClickAction(action) {
            if (lodash.isNonEmpty(action.confirm)) {
                showConfirmDialog(action);
            } else {
                onFireAction(action.id);
            }
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({actionType: actionType, index: ctrl.itemIndex});
            ctrl.editMode = false;
        }

        /**
         * Callback method which handles field type changing
         * @param {Object} newType - type selected in dropdown
         * @param {boolean} isItemChanged - shows whether item was changed
         */
        function onTypeChanged(newType, isItemChanged) {
            if (isItemChanged) {
                if (newType.id === 'secret' || newType.id === 'configmap') {
                    var specificType = newType.id === 'secret' ? 'secretKeyRef' : 'configMapKeyRef';
                    var value = {
                        key: '',
                        name: ''
                    };

                    ctrl.data = lodash.omit(ctrl.data, ['value', 'valueFrom']);
                    lodash.set(ctrl.data, 'valueFrom.' + specificType, value);

                    $rootScope.$broadcast('key-value-type-changed', false);
                } else {
                    ctrl.data = lodash.omit(ctrl.data, 'valueFrom');
                    lodash.set(ctrl.data, 'value', '');
                }

                if (ctrl.submitOnFly) {
                    $timeout(saveChanges);
                }
            }
        }

        /**
         * On open default dropdown
         */
        function openDropdown() {
            $timeout(function () {
                var parent = angular.element(document).find('.' + ctrl.listClass)[0];
                var dropdown = angular.element(document).find('.' + ctrl.listClass + ' .default-dropdown-container')[0];
                var parentRect = parent.getBoundingClientRect();
                var dropdownRect = dropdown.getBoundingClientRect();

                parent = angular.element(parent);

                if (dropdownRect.bottom > parentRect.bottom) {
                    parent.css({'padding-bottom': dropdownRect.bottom - parentRect.bottom + 'px'});
                }
            });
        }

        /**
         * On close default dropdown
         */
        function closeDropdown() {
            var parent = angular.element(angular.element(document).find('.' + ctrl.listClass)[0]);
            parent.css({'padding-bottom': '0px'});
        }

        /**
         * Enables edit mode
         */
        function onEditInput() {
            ctrl.editMode = true;

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
        }

        /**
         * Checks if show dot menu
         */
        function showDotMenu() {
            return ctrl.actions.length > 1;
        }

        //
        // Private method
        //

        /**
         * Shows confirm dialog
         * @param {Object} action - e.g. `delele`
         */
        function showConfirmDialog(action) {
            var message = lodash.isNil(action.confirm.description) ? action.confirm.message : {
                message: action.confirm.message,
                description: action.confirm.description
            };

            DialogsService.confirm(message, action.confirm.yesLabel, action.confirm.noLabel, action.confirm.type)
                .then(function () {
                    onFireAction(action.id);
                });
        }

        /**
         * Gets types list
         * @returns {Array.<Object>}
         */
        function getTypesList() {
            return [
                {
                    id: 'value',
                    name: $i18next.t('common:VALUE', {lng: lng})
                },
                {
                    id: 'secret',
                    name: $i18next.t('functions:SECRET', {lng: lng})
                },
                {
                    id: 'configmap',
                    name: $i18next.t('functions:CONFIGMAP', {lng: lng})
                }
            ];
        }

        /**
         * Gets field which should be setted from value input
         * @returns {string}
         */
        function getValueField() {
            return !ctrl.useType || ctrl.getType() === 'value' ? 'value' :
                   ctrl.getType() === 'configmap'              ? 'valueFrom.configMapKeyRef' : 'valueFrom.secretKeyRef';
        }

        /**
         * Gets actions
         * @returns {Array.<Object>}
         */
        function initActions() {
            return [
                {
                    label: $i18next.t('common:DELETE', {lng: lng}),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('common:DELETE_SELECTED_ITEM_CONFIRM', {lng: lng}),
                        yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                        noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                        type: 'critical_alert'
                    }
                }
            ];
        }

        /**
         * Calls callback with new data
         * @param {Event} [event]
         */
        function saveChanges(event) {
            if (angular.isUndefined(event) || $element.find(event.target).length === 0 || event.keyCode === EventHelperService.ENTER) {
                $scope.$evalAsync(function () {
                    ctrl.keyValueInputForm.$submitted = true;

                    if (ctrl.keyValueInputForm.$valid) {
                        ctrl.data.ui = {
                            editModeActive: false,
                            isFormValid: true,
                            name: ctrl.data.ui.name,
                            checked: ctrl.data.ui.checked
                        };

                        if (angular.isDefined(ctrl.changeStateBroadcast)) {
                            $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                                component: ctrl.data.ui.name,
                                isDisabled: false
                            });
                        }

                        ctrl.editMode = false;

                        $document.off('click', saveChanges);
                        $document.off('keypress', saveChanges);
                    } else {
                        ctrl.data.ui = {
                            editModeActive: true,
                            isFormValid: false,
                            name: ctrl.data.ui.name,
                            checked: ctrl.data.ui.checked
                        };

                        if (angular.isDefined(ctrl.changeStateBroadcast)) {
                            $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                                component: ctrl.data.ui.name,
                                isDisabled: true
                            });
                        }
                    }

                    ctrl.changeDataCallback({newData: ctrl.data, index: ctrl.itemIndex});
                })
            }
        }
    }
}());
