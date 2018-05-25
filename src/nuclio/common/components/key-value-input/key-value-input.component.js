(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclKeyValueInput', {
            bindings: {
                actionHandlerCallback: '&',
                changeDataCallback: '&',
                itemIndex: '<',
                rowData: '<',
                useType: '<',
                keyOptional: '<?',
                listClass: '@?',
                submitOnFly: '<?'
            },
            templateUrl: 'nuclio/common/components/key-value-input/key-value-input.tpl.html',
            controller: NclKeyValueInputController
        });

    function NclKeyValueInputController($document, $element, $rootScope, $scope, $timeout, lodash, EventHelperService) {
        var ctrl = this;

        ctrl.data = {};
        ctrl.typesList = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.closeDropdown = closeDropdown;
        ctrl.onEditInput = onEditInput;
        ctrl.getInputValue = getInputValue;
        ctrl.getType = getType;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onFireAction = onFireAction;
        ctrl.openDropdown = openDropdown;
        ctrl.onTypeChanged = onTypeChanged;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.data = lodash.cloneDeep(ctrl.rowData);
            ctrl.editMode = lodash.get(ctrl.data, 'ui.editModeActive', false);

            ctrl.actions = initActions();
            ctrl.submitOnFly = lodash.defaultTo(ctrl.submitOnFly, false);
            ctrl.typesList = getTypesList();

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);

            $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.data.ui.name, isDisabled: false});
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

                return specificType === 'value' ? value :
                    value.name + (!lodash.isNil(value.key) ? ':' + value.key : '');
            } else {
                return ctrl.data.value;
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
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            if (lodash.includes(field, 'value') && ctrl.getType() !== 'value') {
                var keyValueData = newData.split(':');

                lodash.set(ctrl.data, getValueField(), {
                    name: keyValueData[0]
                });

                if (keyValueData.length > 1) {
                    var data = lodash.get(ctrl.data, getValueField());

                    data.key = keyValueData[1];
                }
            } else {
                ctrl.data[field] = newData;
            }

            if (ctrl.submitOnFly) {
                saveChanges();
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
                        name: ''
                    };

                    ctrl.data = lodash.omit(ctrl.data, ['value', 'valueFrom']);
                    lodash.set(ctrl.data, 'valueFrom.' + specificType, value);
                } else {
                    ctrl.data = lodash.omit(ctrl.data, 'valueFrom');
                    lodash.set(ctrl.data, 'value', '');
                }

                if (ctrl.submitOnFly) {
                    saveChanges();
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

        //
        // Private method
        //

        /**
         * Gets types list
         * @returns {Array.<Object>}
         */
        function getTypesList() {
            return [
                {
                    id: 'value',
                    name: 'Value'
                },
                {
                    id: 'secret',
                    name: 'Secret'
                },
                {
                    id: 'configmap',
                    name: 'Configmap'
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
                    label: 'Delete',
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: 'Are you sure you want to delete selected item?',
                        yesLabel: 'Yes, Delete',
                        noLabel: 'Cancel',
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
                ctrl.keyValueInputForm.$submitted = true;
                if (ctrl.keyValueInputForm.$valid) {
                    ctrl.data.ui = {
                        editModeActive: false,
                        isFormValid: true,
                        name: ctrl.data.ui.name
                    };
                    $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.data.ui.name, isDisabled: false});

                    $scope.$evalAsync(function () {
                        ctrl.editMode = false;

                        $document.off('click', saveChanges);
                        $document.off('keypress', saveChanges);

                        ctrl.changeDataCallback({newData: ctrl.data, index: ctrl.itemIndex});
                    });
                } else {
                    ctrl.data.ui = {
                        editModeActive: true,
                        isFormValid: false,
                        name: ctrl.data.ui.name
                    };
                    $rootScope.$broadcast('change-state-deploy-button', {component: ctrl.data.ui.name, isDisabled: true});
                }
            }
        }
    }
}());
