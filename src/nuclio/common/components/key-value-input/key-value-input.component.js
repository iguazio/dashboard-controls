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
/* eslint max-statements: ["error", 60] */
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
                changeTypeCallback: '&?',
                dropdownOverlap: '<?',
                isDisabled: '<?',
                isReadOnly: '<?',
                itemIndex: '<',
                keyList: '<?',
                keyOptional: '<?',
                keyPlaceholder: '@?',
                keyTooltip: '<?',
                keyValidationPattern: '<?',
                noDelete: '<?',
                onlyValueInput: '<?',
                rowData: '<',
                submitOnFly: '<?',
                useAdditionalValue: '<?',
                useLabels: '<',
                useType: '<',
                validationRules: '<?',
                valueOptional: '<?',
                valuePlaceholder: '@?',
                valueTooltip: '<?',
                valueValidationPattern: '<?'
            },
            templateUrl: 'nuclio/common/components/key-value-input/key-value-input.tpl.html',
            controller: NclKeyValueInputController
        });

    function NclKeyValueInputController($document, $element, $i18next, $rootScope, $scope, $timeout, i18next, lodash,
                                        DialogsService, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        var VALUE_TYPE = 'value';
        var CONFIGMAP_TYPE = 'configmap';
        var SECRET_TYPE = 'secret';
        var CONFIGMAP_REF_TYPE = 'configmapRef';
        var SECRET_REF_TYPE = 'secretRef';

        var VALUE_FROM = 'valueFrom';
        var CONFIGMAP_KEY_REF = 'configMapKeyRef';
        var SECRET_KEY_REF = 'secretKeyRef';

        var KEY_PATH = 'key';
        var NAME_PATH = 'name';
        var VALUE_PATH = 'value';
        var CONFIGMAP_PATH = VALUE_FROM + '.' + CONFIGMAP_KEY_REF;
        var SECRET_PATH = VALUE_FROM + '.' + SECRET_KEY_REF;
        var CONFIGMAP_REF_PATH = 'configMapRef';
        var SECRET_REF_PATH = 'secretRef';

        var typePathMap = {
            [VALUE_TYPE]: VALUE_PATH,
            [CONFIGMAP_TYPE]: CONFIGMAP_PATH,
            [SECRET_TYPE]: SECRET_PATH,
            [CONFIGMAP_REF_TYPE]: CONFIGMAP_REF_PATH,
            [SECRET_REF_TYPE]: SECRET_REF_PATH
        };

        ctrl.data = {};
        ctrl.keyValueInputForm = null;
        ctrl.onlyTypeNameInputs = false;
        ctrl.typesList = [];

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onChanges = onChanges;

        ctrl.onEditInput = onEditInput;
        ctrl.getInputValue = getInputValue;
        ctrl.getInputKey = getInputKey;
        ctrl.getSelectedItem = getSelectedItem;
        ctrl.getType = getType;
        ctrl.isVisibleByType = isVisibleByType;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.inputKeyCallback = inputKeyCallback;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.onKeyChanged = onKeyChanged;
        ctrl.onTypeChanged = onTypeChanged;

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
                isReadOnly: false,
                submitOnFly: false,
                useAdditionalValue: false,
                valuePlaceholder: $i18next.t('functions:PLACEHOLDER.ENTER_VALUE', {lng: lng})
            });

            $scope.$on('action-checkbox_item-checked', function () {
                if (angular.isFunction(ctrl.changeDataCallback)) {
                    ctrl.changeDataCallback({
                        newData: ctrl.data,
                        index: ctrl.itemIndex
                    });
                }
            });
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.onlyTypeNameInputs = [SECRET_REF_TYPE, CONFIGMAP_REF_TYPE].includes(ctrl.getType());

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
            ctrl.keyValueInputForm.$setPristine();
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);

            if (angular.isDefined(ctrl.changeStateBroadcast)) {
                $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                    component: ctrl.data.ui.name,
                    isDisabled: ctrl.keyValueInputForm.$invalid
                });
            }
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'noDelete')) {
                lodash.defaults(ctrl, {
                    noDelete: false
                });
                ctrl.actions = initActions();
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
                var specificType = typePathMap[ctrl.getType()];
                var value = lodash.get(ctrl.data, specificType);

                return specificType === VALUE_TYPE ? value : value[NAME_PATH];
            } else {
                return ctrl.data[VALUE_PATH];
            }
        }

        /**
         * Gets model for value-key input
         * @returns {?string}
         */
        function getInputKey() {
            if (ctrl.useType && ctrl.getType() !== VALUE_TYPE) {
                var specificType = typePathMap[ctrl.getType()];
                var value = lodash.get(ctrl.data, specificType);

                return value[KEY_PATH];
            } else {
                return null;
            }
        }

        /**
         * Gets selected item in dropdown
         * @returns {Object}
         */
        function getSelectedItem() {
            return lodash.get(ctrl.data, NAME_PATH) === '' ? lodash.find(ctrl.keyList, ['disabled', false]) : ctrl.data;
        }

        /**
         * Gets selected type
         * @returns {string}
         */
        function getType() {
            if (!ctrl.useType || !lodash.isNil(ctrl.data[VALUE_PATH])) {
                return VALUE_TYPE;
            }

            for (var typePathCollection of Object.entries(typePathMap)) {
                if (lodash.get(ctrl.data, typePathCollection[1])) {
                    return typePathCollection[0];
                }
            }
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
            if (lodash.includes(field, VALUE_PATH) && ctrl.getType() !== VALUE_TYPE) {

                lodash.assign(lodash.get(ctrl.data, getValueField()), {
                    [NAME_PATH]: newData
                });

            } else {
                ctrl.data[field] = newData;

                if (ctrl.keyList) {
                    var keyData = getSelectedItem();
                    lodash.set(ctrl.data, NAME_PATH, keyData[NAME_PATH]);
                }
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
                [KEY_PATH]: newData
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
            ctrl.actionHandlerCallback({
                actionType: actionType,
                index: ctrl.itemIndex
            });
            ctrl.editMode = false;
        }

        /**
         * Handles changing value of field Key in case it is a drop-down menu (on selecting an option).
         * @param {Object} newKey - type selected in dropdown
         */
        function onKeyChanged(newKey) {
            ctrl.data = lodash.omit(ctrl.data, VALUE_FROM);
            lodash.set(ctrl.data, NAME_PATH, newKey[NAME_PATH]);

            if (ctrl.submitOnFly) {
                $timeout(saveChanges);
            }

        }

        /**
         * Callback method which handles field type changing
         * @param {Object} newType - type selected in dropdown
         * @param {boolean} isItemChanged - shows whether item was changed
         */
        function onTypeChanged(newType, isItemChanged) {
            if (isItemChanged) {
                var specificType;
                var value;

                ctrl.onlyTypeNameInputs = false;

                if (newType.id === SECRET_TYPE || newType.id === CONFIGMAP_TYPE) {
                    specificType = newType.id === SECRET_TYPE ? SECRET_KEY_REF : CONFIGMAP_KEY_REF;
                    value = {
                        [KEY_PATH]: '',
                        [NAME_PATH]: ''
                    };

                    ctrl.data = lodash.omit(ctrl.data, [VALUE_PATH, VALUE_FROM, SECRET_REF_PATH, CONFIGMAP_REF_PATH]);
                    lodash.set(ctrl.data, [VALUE_FROM, specificType], value);
                } else if (newType.id === SECRET_REF_TYPE || newType.id === CONFIGMAP_REF_TYPE) {
                    ctrl.onlyTypeNameInputs = true;

                    specificType = newType.id === SECRET_REF_TYPE ? SECRET_REF_PATH : CONFIGMAP_REF_PATH;
                    value = {
                        [NAME_PATH]: ''
                    };

                    ctrl.data = lodash.omit(ctrl.data, [VALUE_PATH, VALUE_FROM, SECRET_REF_PATH, CONFIGMAP_REF_PATH, NAME_PATH]);
                    lodash.set(ctrl.data, specificType, value);
                } else {
                    ctrl.data = lodash.omit(ctrl.data, [VALUE_FROM, SECRET_REF_PATH, CONFIGMAP_REF_PATH]);
                    lodash.set(ctrl.data, VALUE_PATH, '');
                }

                if (angular.isFunction(ctrl.changeTypeCallback)) {
                    ctrl.changeTypeCallback({
                        newType: newType,
                        index: ctrl.itemIndex
                    });
                }

                if (ctrl.submitOnFly) {
                    $timeout(saveChanges);
                }
            }
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
                    id: VALUE_TYPE,
                    name: $i18next.t('common:VALUE', {lng: lng})
                },
                {
                    id: SECRET_TYPE,
                    name: $i18next.t('functions:SECRET', {lng: lng})
                },
                {
                    id: SECRET_REF_TYPE,
                    name: $i18next.t('functions:SECRET_KEY', {lng: lng})
                },
                {
                    id: CONFIGMAP_TYPE,
                    name: $i18next.t('functions:CONFIGMAP', {lng: lng})
                },
                {
                    id: CONFIGMAP_REF_TYPE,
                    name: $i18next.t('functions:CONFIGMAP_KEY', {lng: lng})
                }
            ];
        }

        /**
         * Gets field which should be setted from value input
         * @returns {string}
         */
        function getValueField() {
            return !ctrl.useType ? VALUE_TYPE : typePathMap[ctrl.getType()];
        }

        /**
         * Gets actions
         * @returns {Array.<Object>}
         */
        function initActions() {
            return ctrl.noDelete ? [] : [
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
            if (angular.isUndefined(event) || $element.find(event.target).length === 0 ||
                event.keyCode === EventHelperService.ENTER) {

                ctrl.changeDataCallback({
                    newData: ctrl.data,
                    index: ctrl.itemIndex
                });

                $scope.$evalAsync(function () {

                    // when the user attempts to apply the key-value item by clicking outside of it or pressing the
                    // Enter key - the rest of the fields on the form should be re-validated, so invalid ones should
                    // be displayed as invalid
                    if (angular.isDefined(event)) {
                        lodash.forEach(ctrl.keyValueInputForm.$getControls(), function (control) {
                            control.$setDirty();
                            control.$validate();
                        });
                    }

                    if (ctrl.keyValueInputForm.$valid) {
                        lodash.assign(ctrl.data.ui, {
                            editModeActive: false,
                            isFormValid: true
                        });

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
                        lodash.assign(ctrl.data.ui, {
                            editModeActive: true,
                            isFormValid: false
                        });

                        if (angular.isDefined(ctrl.changeStateBroadcast)) {
                            $rootScope.$broadcast(ctrl.changeStateBroadcast, {
                                component: ctrl.data.ui.name,
                                isDisabled: true
                            });
                        }
                    }

                    ctrl.changeDataCallback({
                        newData: ctrl.data,
                        index: ctrl.itemIndex
                    });
                })
            }
        }
    }
}());
