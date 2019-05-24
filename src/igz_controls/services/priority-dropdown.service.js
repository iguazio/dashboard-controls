(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('PriorityDropdownService', PriorityDropdownService);

    function PriorityDropdownService($i18next, i18next) {
        return {
            getName: getName,
            getPrioritiesArray: getPrioritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of priority types
         * @returns {Array}
         */
        function getPrioritiesArray() {
            var lng = i18next.language;

            return [
                {
                    name: $i18next.t('common:REAL_TIME', {lng: lng}),
                    type: 'realtime',
                    icon: {
                        name: 'igz-icon-priority-realtime'
                    }
                },
                {
                    name: $i18next.t('common:HIGH', {lng: lng}),
                    type: 'high',
                    icon: {
                        name: 'igz-icon-priority-high'
                    }
                },
                {
                    name: $i18next.t('common:STANDARD', {lng: lng}),
                    type: 'standard',
                    icon: {
                        name: 'igz-icon-priority-standard'
                    }
                },
                {
                    name: $i18next.t('common:LOW', {lng: lng}),
                    type: 'low',
                    icon: {
                        name: 'igz-icon-priority-low'
                    }
                }
            ];
        }

        /**
         * Gets name of priority depends on type
         * @param {string} type
         * @returns {string}
         */
        function getName(type) {
            var lng = i18next.language;

            return type === 'realtime' ? $i18next.t('common:REAL_TIME', {lng: lng}) :
                   type === 'high'     ? $i18next.t('common:HIGH', {lng: lng})      :
                   type === 'standard' ? $i18next.t('common:STANDARD', {lng: lng})  :
                   type === 'low'      ? $i18next.t('common:LOW', {lng: lng})       : '';
        }
    }
}());
