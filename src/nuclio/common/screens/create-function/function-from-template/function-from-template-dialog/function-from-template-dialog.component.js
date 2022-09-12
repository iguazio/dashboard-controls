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
        .component('nclFunctionFromTemplateDialog', {
            bindings: {
                closeDialog: '&',
                template: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/function-from-template/function-from-template-dialog/function-from-template-dialog.tpl.html',
            controller: NclFunctionFromTemplateDialogController
        });

    function NclFunctionFromTemplateDialogController($i18next, i18next, lodash, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        var FILED_KINDS = ['string', 'number', 'choice'];

        var defaultAttributes = {
            string: {
                defaultValue: '',
                password: false
            },
            number: {
                defaultValue: 0,
                step: 1,
                minValue: -Infinity,
                allowZero: false,
                allowNegative: false,
                allowDecimal: false
            },
            choice: {
                choices: [],
                defaultValue: '' // currently assuming "choice" to be a list of strings only
            }
        };
        var templateData = {};

        ctrl.dropdownOptions = {};
        ctrl.fields = [];
        ctrl.templateForm = null;

        ctrl.$onInit = onInit;

        ctrl.dropdownCallback = dropdownCallback;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isFormFilled = isFormFilled;
        ctrl.onApply = onApply;
        ctrl.onClose = onClose;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.fields = lodash.chain(ctrl.template.values)
                .cloneDeep()
                .forIn(function (field, key) {
                    field.name = key;
                })
                .filter(function (field) {
                    var kind = lodash.get(field, 'kind');
                    return lodash.isString(kind) ? lodash.includes(FILED_KINDS, kind.toLowerCase()) : false;
                })
                .map(function (field) {

                    // converting `kind` property to lower-case in order to be more flexible, allowing the user to
                    // specify kind in case-insensitive.
                    field.kind = field.kind.toLowerCase();

                    // setting default values to various properties
                    lodash.defaults(field, {
                        displayName: $i18next.t('functions:UNSPECIFIED_FIELD_NAME', {lng: lng}),
                        description: '',
                        required: false,
                        order: Infinity,
                        attributes: lodash.defaults(field.attributes, defaultAttributes[field.kind])
                    });

                    if (field.kind === 'number') {
                        if (!field.attributes.allowNegative && field.attributes.minValue < 0) {
                            field.attributes.minValue = field.attributes.allowZero ? 0 : 1;
                        }
                    }

                    if (field.kind === 'choice') {
                        lodash.update(field, 'attributes.choices', function (choices) {
                            return !lodash.isArray(choices) ? [] : lodash.map(choices, function (choice) {
                                return lodash.isString(choice) ? {
                                    id: choice,
                                    name: choice,
                                    visible: true
                                } : choice;
                            });
                        });
                    }

                    return field;
                })
                .uniqBy('name') // prevent `ngRepeat` from breaking on duplicates.
                .sortBy('order')
                .forEach(function (field) {
                    lodash.set(templateData, field.name, field.attributes.defaultValue);
                })
                .value();
        }

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        /**
         * Closes dialog and pass the dialog data
         * @param {Event} [event]
         */
        function onApply(event) {
            if (isFormFilled()) {
                if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) &&
                    !ctrl.isLoadingState) {
                    ctrl.closeDialog({ template: templateData });
                }
            }
        }

        /**
         * Checks if form valid
         */
        function isFormFilled() {
            return lodash.isEmpty(ctrl.templateForm.$error);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(templateData, field, newData);
        }

        /**
         * Sets new selected value from dropdown
         * @param {Object} newData
         * @param {boolean} isChanged
         * @param {string} field
         */
        function dropdownCallback(newData, isChanged, field) {
            if (isChanged) {
                lodash.set(templateData, field, newData.id);
            }
        }
    }
}());
