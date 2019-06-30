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
