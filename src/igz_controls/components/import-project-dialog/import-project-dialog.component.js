(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzImportProjectDialog', {
            bindings: {
                closeDialog: '&',
                dialogTitle: '<',
                displayAllOptions: '<'
            },
            templateUrl: 'igz_controls/components/import-project-dialog/import-project-dialog.tpl.html',
            controller: IgzImportProjectDialogController
        });

    function IgzImportProjectDialogController($scope, $i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        var checkedItem = 'singleFunction';

        ctrl.option = [];
        ctrl.optionList = [
            {
                label: $i18next.t('common:APPLY_TO_ALL_FUNCTIONS_IN_THIS_PROJECT', {lng: lng}),
                id: 'singleProject',
                value: 'singleProject',
                disabled: false,
                visibility: true,
            },
            {
                label: $i18next.t('common:APPLY_TO_ALL_FUNCTIONS_IN_ALL_PROJECT', {lng: lng}),
                id: 'allProjects',
                value: 'allProjects',
                disabled: false,
                visibility: true,
            }
        ];

        ctrl.$onInit = onInit;

        ctrl.onClose = onClose;
        ctrl.onCheckboxChange = onCheckboxChange;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.set(ctrl.optionList, '[1].visibility', ctrl.displayAllOptions);
        }

        //
        // Public methods
        //

        /**
         * Handles checking/un-checking checkbox
         */
        function onCheckboxChange() {
            if (!lodash.isNil(ctrl.option)) {
                if (lodash.includes(ctrl.option, 'allProjects')) {
                    lodash.set(ctrl.optionList, '[0].disabled', true);

                    if (ctrl.option.length === 1) {
                        ctrl.option.unshift('singleProject');
                    }
                } else {
                    lodash.set(ctrl.optionList, '[0].disabled', false);
                }
                ctrl.optionList = angular.copy(ctrl.optionList);
                ctrl.option = angular.copy(ctrl.option);
                checkedItem = lodash.get(ctrl.option, [ctrl.option.length - 1]);
            } else {
                checkedItem = 'singleFunction';
            }
        }

        /**
         * Closes dialog
         * @param {string} action
         */
        function onClose(action) {
            ctrl.closeDialog({action: action, option: checkedItem});
            ctrl.option = [];
        }
    }
}());
