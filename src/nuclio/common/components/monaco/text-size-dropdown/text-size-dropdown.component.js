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
