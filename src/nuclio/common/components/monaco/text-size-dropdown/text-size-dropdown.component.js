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

    function NclTextSizeDropdownController(lodash) {
        var ctrl = this;

        ctrl.textSizes = [
            {
                label: 'Small',
                id: 'small',
                value: '10px'
            },
            {
                label: 'Normal',
                id: 'normal',
                value: '14px'
            },
            {
                label: 'Large',
                id: 'large',
                value: '18px'
            },
            {
                label: 'Huge',
                id: 'huge',
                value: '22px'
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
