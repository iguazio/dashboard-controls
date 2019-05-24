(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclTextSizeDropdown', {
            bindings: {
                updateDataCallback: '&?'
            },
            templateUrl: 'nuclio/common/components/monaco/text-size-dropdown/text-size-dropdown.tpl.html',
            controller: NclTextSizeDropdownController
        });

    function NclTextSizeDropdownController($i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.textSizes = [
            {
                label: $i18next.t('functions:SMALL', {lng: lng}),
                id: 'small',
                value: '8px'
            },
            {
                label: $i18next.t('functions:NORMAL', {lng: lng}),
                id: 'normal',
                value: '12px'
            },
            {
                label: $i18next.t('functions:LARGE', {lng: lng}),
                id: 'large',
                value: '16px'
            },
            {
                label: $i18next.t('functions:HUGE', {lng: lng}),
                id: 'huge',
                value: '20px'
            },
        ];

        ctrl.$onInit = onInit;

        ctrl.changeTextSize = changeTextSize;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            ctrl.selectedTextSize = lodash.get(lodash.find(ctrl.textSizes, {id: 'normal'}), 'value');

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({newTextSize: ctrl.selectedTextSize});
            }
        }

        //
        // Public methods
        //

        /**
         * Changes text size in monaco editor
         * @param {string} textSize
         */
        function changeTextSize(textSize) {
            ctrl.selectedTextSize = textSize;

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({newTextSize: ctrl.selectedTextSize});
            }
        }
    }
}());
