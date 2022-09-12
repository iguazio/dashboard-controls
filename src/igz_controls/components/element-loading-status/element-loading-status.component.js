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
        .component('igzElementLoadingStatus', {
            bindings: {
                errorMessage: '@?',
                loadingStatusSize: '@?',
                name: '@',
                refresh: '<?',
                textStatus: '<?',
                title: '@?',
                tooltipLabel: '@?'
            },
            templateUrl: 'igz_controls/components/element-loading-status/element-loading-status.tpl.html',
            controller: IgzElementLoadingStatusController,
            transclude: true
        });

    function IgzElementLoadingStatusController($element, $scope, $state, $i18next, i18next, lodash) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isShowContent = false;
        ctrl.isShowError = false;
        ctrl.isShowSpinner = true;

        ctrl.deregisterHideError = null;
        ctrl.deregisterHideSpinner = null;
        ctrl.deregisterShowError = null;
        ctrl.deregisterShowSpinner = null;

        ctrl.$onDestroy = onDestroy;
        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.checkSize = checkSize;
        ctrl.refreshPage = refreshPage;

        //
        // Hook methods
        //

        /**
         * Destructor method
         */
        function onDestroy() {
            deregisterBroadcasts();
        }

        /**
         * Initialization method
         */
        function onInit() {
            registerBroadcasts();
        }

        /**
         * Changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            lodash.defaults(ctrl, {
                loadingStatusSize: 'default',
                refresh: false,
                title: '',
                tooltipLabel: ''
            });

            if (lodash.isEmpty(ctrl.errorMessage)) {
                lodash.assign(ctrl, {
                    errorMessage: $i18next.t('common:ERROR_MSG.ELEMENT_LOADING_DEFAULT_1', { lng: lng }),
                    title: $i18next.t('common:OOPS', { lng: lng }),
                    refresh: true
                });
            }

            if (changes &&
                changes.name &&
                !lodash.isEmpty(changes.name.previousValue) &&
                changes.name.currentValue !== changes.name.previousValue) {
                deregisterBroadcasts();
                registerBroadcasts();
            }
        }

        //
        // Public methods
        //

        /**
         * Check if given size is actual
         * @param {string} size - size name ('small', 'default')
         */
        function checkSize(size) {
            return ctrl.loadingStatusSize === size;
        }

        /**
         * Refresh current page (ui-router state)
         * @param {Object} $event - angular event object
         */
        function refreshPage($event) {

            // Prevent 'upper' events to be triggered
            $event.stopPropagation();

            $state.go($state.current, {}, {reload: true});
        }

        //
        // Private methods
        //

        /**
         * Deregister broadcasts
         */
        function deregisterBroadcasts() {
            ctrl.deregisterHideError();
            ctrl.deregisterHideSpinner();
            ctrl.deregisterShowError();
            ctrl.deregisterShowSpinner();
        }

        /**
         * Hide given loading error
         */
        function hideError() {
            ctrl.isShowError = false;
        }

        /**
         * Hide given loading spinner
         */
        function hideSpinner() {
            ctrl.isShowSpinner = false;
            ctrl.isShowContent = true;
        }

        /**
         * Register broadcasts
         */
        function registerBroadcasts() {
            ctrl.deregisterHideError = $scope.$on('element-loading-status_hide-error_' + ctrl.name, hideError);
            ctrl.deregisterHideSpinner = $scope.$on('element-loading-status_hide-spinner_' + ctrl.name, hideSpinner);
            ctrl.deregisterShowError = $scope.$on('element-loading-status_show-error_' + ctrl.name, showError);
            ctrl.deregisterShowSpinner = $scope.$on('element-loading-status_show-spinner_' + ctrl.name, showSpinner);
        }

        /**
         * Show given loading error
         */
        function showError() {
            ctrl.isShowError = true;
            ctrl.isShowSpinner = false;
        }

        /**
         * Show given loading spinner
         */
        function showSpinner() {
            ctrl.isShowError = false;
            ctrl.isShowContent = false;
            ctrl.isShowSpinner = true;
        }
    }
}());
