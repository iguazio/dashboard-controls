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
        .component('nclCollapsingRow', {
            bindings: {
                actionHandlerCallback: '&',
                readOnly: '<?',
                item: '<',
                itemIndex: '<?',
                type: '@',
                deleteTestId: '@?'
            },
            templateUrl: 'nuclio/common/components/collapsing-row/collapsing-row.tpl.html',
            controller: NclCollapsingRowController,
            transclude: true
        });

    function NclCollapsingRowController($i18next, $timeout, i18next, lodash, DialogsService, FunctionsService,
                                        MaskService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [];

        ctrl.$onInit = onInit;

        ctrl.isNil = lodash.isNil;
        ctrl.isNumber = lodash.isNumber;
        ctrl.getMask = MaskService.getMask;

        ctrl.getAttributeValue = getAttributeValue;
        ctrl.isVolumeType = isVolumeType;
        ctrl.onCollapse = onCollapse;
        ctrl.onClickAction = onClickAction;
        ctrl.onFireAction = onFireAction;
        ctrl.showDotMenu = showDotMenu;
        ctrl.toggleItem = toggleItem;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaultsDeep(ctrl.item, {
                ui: {
                    editModeActive: false,
                    expandable: true
                }
            });

            ctrl.classList = FunctionsService.getClassesList(ctrl.type);
            ctrl.displayedAttributesFields = lodash.chain(ctrl.classList)
                .find(function (aClass) {
                    return aClass.id === ctrl.item.kind;
                })
                .get('fields', [])
                .filter(function (field) {
                    return lodash.get(field, 'path', '').startsWith('attributes');
                })
                .map(function (field) {
                    return field.name;
                })
                .value();

            if (!lodash.isEmpty(ctrl.item.kind)) {
                ctrl.selectedClass = lodash.find(ctrl.classList, ['id', ctrl.item.kind]);
                ctrl.item.ui.selectedClass = ctrl.selectedClass;
            }

            ctrl.actions = initActions();
        }

        //
        // Public methods
        //

        /**
         * Returns attribute value
         * @param {string} key - attribute key
         * @param {string|Object} value - attribute value
         * @returns {string|Object}
         */
        function getAttributeValue(key, value) {
            var attrValue = value;

            if (key === 'schedule') {
                attrValue = '0 ' + value;
            } else if (MaskService.commonSensitiveFields.includes(key) || key === 'sasl') {
                attrValue = typeof value === 'string' ? MaskService.getMask(value) :
                                                        MaskService.getObjectWithMask(value);
            }

            return attrValue;
        }

        /**
         * Checks if input have to be visible for specific item type
         * @returns {boolean}
         */
        function isVolumeType() {
            return ctrl.type === 'volume';
        }

        /**
         * Changes item's expanded state
         */
        function onCollapse(event) {
            if (!ctrl.item.ui.editModeActive) {
                ctrl.actionHandlerCallback({
                    actionType: 'edit',
                    selectedItem: ctrl.item,
                    index: ctrl.itemIndex
                });
                event.stopPropagation();
            } else {
                $timeout(function () {
                    if (ctrl.item.ui.expandable) {
                        ctrl.item.ui.editModeActive = false;
                    }
                });
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
                selectedItem: ctrl.item,
                index: ctrl.itemIndex
            });
        }

        /**
         * Checks if show dot menu
         */
        function showDotMenu() {
            return ctrl.actions.length > 1;
        }

        /**
         * Enables/disables item
         */
        function toggleItem() {
            ctrl.item.enable = !ctrl.item.enable;
        }

        //
        // Private methods
        //

        /**
         * Shows confirm dialog
         * @param {Object} action - e.g. `delete`
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
         * Initializes actions
         * @returns {Object[]} - list of actions
         */
        function initActions() {
            return [
                {
                    label: $i18next.t('common:DELETE', { lng: lng }),
                    id: 'delete',
                    icon: 'igz-icon-trash',
                    active: true,
                    confirm: {
                        message: $i18next.t('functions:DELETE_ITEM', { lng: lng }),
                        description: $i18next.t('functions:DELETE_DESCRIPTION', { lng: lng }),
                        yesLabel: $i18next.t('common:YES_DELETE', { lng: lng }),
                        noLabel: $i18next.t('common:CANCEL', { lng: lng }),
                        type: 'nuclio_alert'
                    }
                }
            ];
        }
    }
}());
